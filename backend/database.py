import sqlite3
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_FOLDER = os.path.join(BASE_DIR, '..', 'data')
DB_PATH = os.path.join(DB_FOLDER, 'historico.db')

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    if not os.path.exists(DB_FOLDER):
        os.makedirs(DB_FOLDER)
    conn = get_db_connection()
    conn.cursor().execute('''
        CREATE TABLE IF NOT EXISTS calculos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            demanda REAL NOT NULL,
            custo_total REAL NOT NULL,
            lambda_val REAL NOT NULL,
            data_calculo TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

def salvar_calculo(demanda, custo_total, lambda_val):
    conn = get_db_connection()
    conn.execute(
        'INSERT INTO calculos (demanda, custo_total, lambda_val) VALUES (?, ?, ?)',
        (demanda, custo_total, lambda_val)
    )
    conn.commit()
    conn.close()

def listar_historico():
    """Retorna os últimos 10 cálculos para a tabela na tela."""
    conn = get_db_connection()
    calculos = conn.execute('SELECT * FROM calculos ORDER BY id DESC LIMIT 10').fetchall()
    conn.close()
    return [dict(ix) for ix in calculos]

def listar_todos_para_csv():
    """Retorna TUDO para o relatório CSV."""
    conn = get_db_connection()
    calculos = conn.execute('SELECT * FROM calculos ORDER BY id DESC').fetchall()
    conn.close()
    return [dict(ix) for ix in calculos]