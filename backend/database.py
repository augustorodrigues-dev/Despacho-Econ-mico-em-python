import sqlite3
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_FOLDER = os.path.join(BASE_DIR, '..', 'data') # Salva na pasta data/ fora do backend
if not os.path.exists(DB_FOLDER):
    # Fallback para salvar localmente se a pasta data não existir (comum em deploy)
    DB_FOLDER = BASE_DIR

DB_PATH = os.path.join(DB_FOLDER, 'historico.db')

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    if not os.path.exists(DB_FOLDER):
        os.makedirs(DB_FOLDER)
    conn = get_db_connection()
    conn.execute('''
        CREATE TABLE IF NOT EXISTS calculos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            demanda REAL,
            custo_total REAL,
            lambda_val REAL,
            data_calculo TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

def salvar_calculo(demanda, custo, lam):
    conn = get_db_connection()
    conn.execute('INSERT INTO calculos (demanda, custo_total, lambda_val) VALUES (?, ?, ?)', (demanda, custo, lam))
    conn.commit()
    conn.close()

def listar_historico():
    conn = get_db_connection()
    rows = conn.execute('SELECT * FROM calculos ORDER BY id DESC LIMIT 50').fetchall()
    conn.close()
    return [dict(row) for row in rows]