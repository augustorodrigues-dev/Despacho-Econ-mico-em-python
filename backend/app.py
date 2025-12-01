import sqlite3
import csv
import io
import os
from flask import Flask, request, jsonify, make_response, render_template
from flask_cors import CORS
from optimization import calcular_despacho
from database import init_db, salvar_calculo, listar_historico

app = Flask(__name__, template_folder='templates', static_folder='static')
CORS(app) 

init_db()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/calcular', methods=['POST'])
def calcular():
    data = request.json
    try:
        demanda_str = data.get('demanda')
        if not demanda_str:
            return jsonify({'sucesso': False, 'mensagem': 'Demanda não informada'}), 400
            
        demanda = float(demanda_str)
      
        resultado = calcular_despacho(demanda)
        
        if 'erro' in resultado:
            return jsonify({'sucesso': False, 'mensagem': resultado['erro']}), 400

        salvar_calculo(demanda, resultado['custo_total'], resultado['lambda'])

        return jsonify({'sucesso': True, 'dados': resultado})

    except ValueError:
        return jsonify({'sucesso': False, 'mensagem': 'Valor inválido. Use apenas números.'}), 400
    except Exception as e:
        return jsonify({'sucesso': False, 'mensagem': str(e)}), 500

@app.route('/api/historico', methods=['GET'])
def historico():
    try:
        dados = listar_historico()
        return jsonify(dados)
    except Exception as e:
        return jsonify({'erro': str(e)}), 500

@app.route('/api/exportar_csv', methods=['GET'])
def exportar_csv():
    try:
        dados = listar_historico()
        si = io.StringIO()
        cw = csv.writer(si, delimiter=';')
        
        cw.writerow(['ID', 'Demanda (MW)', 'Custo Total ($)', 'Lambda ($/MWh)', 'Data/Hora'])
        
        for linha in dados:
            cw.writerow([
                linha['id'], 
                str(linha['demanda']).replace('.', ','), 
                str(linha['custo_total']).replace('.', ','), 
                str(linha['lambda_val']).replace('.', ','), 
                linha['data_calculo']
            ])
            
        output = make_response(si.getvalue())
        output.headers["Content-Disposition"] = "attachment; filename=relatorio_despacho.csv"
        output.headers["Content-type"] = "text/csv"
        return output

    except Exception as e:
        return jsonify({'erro': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)