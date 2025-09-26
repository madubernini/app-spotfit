from flask import Flask, jsonify, request
from flask_cors import CORS
import pyodbc

app = Flask(__name__)
CORS(app)

server = 'localhost\\SQLEXPRESS'
database = 'SpotFitDB'
username = 'root'
password = '0102030405'
driver = '{ODBC Driver 17 for SQL Server}'

conn_str = f'DRIVER={driver};SERVER={server};DATABASE={database};UID={username};PWD={password}'
conn = pyodbc.connect(conn_str)
cursor = conn.cursor()

# Rota para listar todos os locais
@app.route('/locais', methods=['GET'])
def get_locais():
    cursor.execute("SELECT * FROM Locais")
    rows = cursor.fetchall()
    locais = []
    for row in rows:
        locais.append({
            "id": row.id,
            "nome": row.nome,
            "tipo": row.tipo,
            "endereco": row.endereco,
            "latitude": row.latitude,
            "longitude": row.longitude,
            "infraestrutura": row.infraestrutura,
            "acessibilidade": row.acessibilidade,
            "seguranca": row.seguranca,
            "conservacao": row.conservacao
        })
    return jsonify(locais)

# Rota para obter um local por ID
@app.route('/locais/<int:local_id>', methods=['GET'])
def get_local(local_id):
    cursor.execute("SELECT * FROM Locais WHERE id = ?", local_id)
    row = cursor.fetchone()
    if row:
        local = {
            "id": row.id,
            "nome": row.nome,
            "tipo": row.tipo,
            "endereco": row.endereco,
            "latitude": row.latitude,
            "longitude": row.longitude,
            "infraestrutura": row.infraestrutura,
            "acessibilidade": row.acessibilidade,
            "seguranca": row.seguranca,
            "conservacao": row.conservacao
        }
        return jsonify(local)
    else:
        return jsonify({"error": "Local não encontrado"}), 404

if __name__ == '__main__':
    app.run(debug=True)
