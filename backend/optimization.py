import sympy as sp

GERADORES = {
    'G1': {'a': 0.0024, 'b': 21.0,  'c': 1530, 'min': 37.0, 'max': 150.0},
    'G2': {'a': 0.0029, 'b': 20.16, 'c': 992,  'min': 40.0, 'max': 160.0},
    'G3': {'a': 0.021,  'b': 20.4,  'c': 600,  'min': 50.0, 'max': 190.0}
}

def calcular_despacho(demanda_total):
    """
    Realiza o cálculo de despacho econômico com tratamento robusto de limites.
    """
    try:
        
        soma_minimos = sum(g['min'] for g in GERADORES.values())
        soma_maximos = sum(g['max'] for g in GERADORES.values())

        if demanda_total < soma_minimos:
            return {'erro': f"Demanda impossível! O mínimo físico do sistema é {soma_minimos} MW."}
        
        if demanda_total > soma_maximos:
            return {'erro': f"Demanda impossível! O máximo físico do sistema é {soma_maximos} MW."}

        geradores_ativos = list(GERADORES.keys())
        potencias_finais = {g: 0.0 for g in GERADORES} # Começa zerado
        lambda_val = 0.0
 
        for _ in range(10):
    
            maior_violacao = 0.0
            gerador_violador = None
            tipo_violacao = None
            violacao_detectada = False
            solucao_temp = {}
           
            if not geradores_ativos:
                break

            simbolos_P = {g: sp.symbols(f'P_{g}', real=True) for g in geradores_ativos}
            lam = sp.symbols('lambda', real=True)
          
            custo_lagrange = 0
            soma_potencias_ativas = 0
            
   
            carga_fixa = sum(potencias_finais[g] for g in GERADORES if g not in geradores_ativos)
            demanda_para_ativos = demanda_total - carga_fixa
            
            for g in geradores_ativos:
                par = GERADORES[g]
                P_sym = simbolos_P[g]
                custo_lagrange += par['a'] * P_sym**2 + par['b'] * P_sym + par['c']
                soma_potencias_ativas += P_sym
                
            L = custo_lagrange - lam * (soma_potencias_ativas - demanda_para_ativos)
            
          
            equacoes = []
            for g in geradores_ativos:
                equacoes.append(sp.diff(L, simbolos_P[g])) 
            equacoes.append(sp.diff(L, lam)) 
            
            
            variaveis = list(simbolos_P.values()) + [lam]
            resultado = sp.solve(equacoes, variaveis)
            
            if not resultado:
                raise ValueError("Erro matemático: O sistema linear não convergiu.")

            
            if isinstance(resultado, dict):
                for g in geradores_ativos:
                    solucao_temp[g] = float(resultado[simbolos_P[g]])
                lambda_val = float(resultado[lam])
            elif isinstance(resultado, list):
                
                if len(resultado) > 0 and isinstance(resultado[0], tuple):
                    res_tuple = resultado[0]
                    for idx, g in enumerate(geradores_ativos):
                        solucao_temp[g] = float(res_tuple[idx])
                    lambda_val = float(res_tuple[-1])
                else:
                    
                    for idx, g in enumerate(geradores_ativos):
                        solucao_temp[g] = float(resultado[idx])
            
            
            
            for g, potencia in solucao_temp.items():
                lim_min = GERADORES[g]['min']
                lim_max = GERADORES[g]['max']
                
                if potencia > lim_max:
                    diff = potencia - lim_max
                    if diff > maior_violacao:
                        maior_violacao = diff
                        gerador_violador = g
                        tipo_violacao = 'max'
                
                elif potencia < lim_min:
                    diff = lim_min - potencia
                    if diff > maior_violacao:
                        maior_violacao = diff
                        gerador_violador = g
                        tipo_violacao = 'min'

            if gerador_violador:
                violacao_detectada = True
                
                if tipo_violacao == 'max':
                    potencias_finais[gerador_violador] = GERADORES[gerador_violador]['max']
                else:
                    potencias_finais[gerador_violador] = GERADORES[gerador_violador]['min']
                
                
                geradores_ativos.remove(gerador_violador)
                continue
            
            
            potencias_finais.update(solucao_temp)
            break
        
        
        resposta = {
            'geradores': {},
            'lambda': lambda_val,
            'custo_total': 0,
            'status': 'Sucesso'
        }
        
        for g, p in potencias_finais.items():
            par = GERADORES[g]
            custo = par['a']*p**2 + par['b']*p + par['c']
            resposta['custo_total'] += custo
            resposta['geradores'][g] = {'potencia': round(p, 2), 'custo': round(custo, 2)}
            
        return resposta

    except Exception as e:
       
        print(f"ERRO BACKEND: {str(e)}")
        return {'erro': f"Erro interno no cálculo: {str(e)}"}