import matplotlib.pyplot as plt
from optimization import calcular_despacho


demanda_24h = [
    140, 150, 155, 160, 165, 170, 175, 180, 210, 230, 240, 250,
    240, 220, 200, 180, 170, 185, 200, 240, 225, 190, 160, 145
]


custo_artigo = 176165.00 

def validar_modelo():
    print("--- INICIANDO VALIDAÇÃO COM DADOS DO ARTIGO ---")
    print(f"Demanda total acumulada: {sum(demanda_24h)} MW em 24h")
    
    custo_acumulado_nosso = 0
    resultados_hora = []

    print("\nHr | Demanda |   G1   |   G2   |   G3   | Custo Hora ($)")
    print("-" * 60)

    for hora, demanda in enumerate(demanda_24h, 1):
        
        resultado = calcular_despacho(demanda)
        
        if 'erro' in resultado:
            print(f"{hora:02d} | Erro: {resultado['erro']}")
            continue
            
        custo_hora = resultado['custo_total']
        custo_acumulado_nosso += custo_hora
        
        
        p1 = resultado['geradores']['G1']['potencia']
        p2 = resultado['geradores']['G2']['potencia']
        p3 = resultado['geradores']['G3']['potencia']
        
        resultados_hora.append(custo_hora)
        
        print(f"{hora:02d} |  {demanda:3d} MW | {p1:6.1f} | {p2:6.1f} | {p3:6.1f} | ${custo_hora:8.2f}")

    print("-" * 60)
    print(f"\n--- RESULTADO FINAL COMPARATIVO ---")
    print(f"Custo Total (Artigo - Heurística): ${custo_artigo:,.2f}")
    print(f"Custo Total (Nosso - Lagrange):    ${custo_acumulado_nosso:,.2f}")
    
    diferenca = custo_acumulado_nosso - custo_artigo
    print(f"Diferença: ${diferenca:.2f} ({ (diferenca/custo_artigo)*100 :.4f}%)")
    
    if abs(diferenca) < 100: 
        print("\n✅ SUCESSO: O modelo convergiu com o artigo com precisão de Excelência!")
    else:
        print("\n⚠️ ATENÇÃO: Há uma divergência considerável. Verifique os coeficientes.")

    gerar_grafico(demanda_24h, resultados_hora)

def gerar_grafico(demandas, custos):
    plt.figure(figsize=(10, 6))
    
    fig, ax1 = plt.subplots(figsize=(10,6))
    ax1.set_xlabel('Hora do Dia')
    ax1.set_ylabel('Demanda (MW)', color='tab:blue')
    ax1.plot(range(1, 25), demandas, color='tab:blue', marker='o', label='Demanda')
    ax1.tick_params(axis='y', labelcolor='tab:blue')
    ax1.grid(True, alpha=0.3)

    ax2 = ax1.twinx() 
    ax2.set_ylabel('Custo ($)', color='tab:red')
    ax2.plot(range(1, 25), custos, color='tab:red', linestyle='--', marker='x', label='Custo Otimizado')
    ax2.tick_params(axis='y', labelcolor='tab:red')

    plt.title('Validação: Demanda vs Custo Otimizado (24h)')
    plt.tight_layout()
    plt.savefig('grafico_validacao.png')
    print("\n📊 Gráfico 'grafico_validacao.png' gerado com sucesso!")

if __name__ == "__main__":
    validar_modelo()