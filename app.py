import sqlite3
from datetime import datetime
from pathlib import Path

from flask import Flask, jsonify, redirect, render_template, request, session, url_for

app = Flask(__name__)
app.secret_key = "cidade-cidada-dev-secret"

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "banco.db"

TIPOS = {
    "1": "Reclamação",
    "2": "Sugestão",
    "3": "Elogio",
    "4": "Dúvida",
}


def conectar_banco():
    conexao = sqlite3.connect(DB_PATH)
    conexao.row_factory = sqlite3.Row
    return conexao


def iniciar_banco():
    with conectar_banco() as conexao:
        conexao.execute(
            """
            CREATE TABLE IF NOT EXISTS manifestacoes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                protocolo TEXT UNIQUE NOT NULL,
                tipo_id TEXT NOT NULL,
                tipo TEXT NOT NULL,
                titulo TEXT NOT NULL,
                descricao TEXT NOT NULL,
                nome TEXT,
                email TEXT,
                telefone TEXT,
                status TEXT NOT NULL DEFAULT 'Aberto',
                resposta TEXT,
                criado_em TEXT NOT NULL
            )
            """
        )


def gerar_protocolo(conexao):
    proximo_id = conexao.execute(
        "SELECT COALESCE(MAX(id), 0) + 1 AS proximo FROM manifestacoes"
    ).fetchone()["proximo"]
    ano = datetime.now().year
    return f"#OUV-{ano}-{proximo_id:03d}"


def manifestacao_para_json(linha):
    return {
        "protocolo": linha["protocolo"],
        "tipo": linha["tipo"],
        "titulo": linha["titulo"],
        "descricao": linha["descricao"],
        "nome": linha["nome"] or "Não informado",
        "email": linha["email"] or "",
        "telefone": linha["telefone"] or "",
        "status": linha["status"],
        "resposta": linha["resposta"],
        "criado_em": linha["criado_em"],
        "data": datetime.fromisoformat(linha["criado_em"]).strftime("%d/%m/%Y"),
    }


iniciar_banco()


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/acesso_restrito")
def acesso_restrito():
    if not session.get("usuario_logado"):
        return redirect(url_for("login"))

    return render_template("acesso_restrito.html")


@app.route("/login", methods=["GET", "POST"])
def login():
    erro = None

    if request.method == "POST":
        email = request.form.get("email", "").strip()
        senha = request.form.get("senha", "")

        if email == "admin@admin.com" and senha == "admin":
            session["usuario_logado"] = True
            return redirect(url_for("acesso_restrito"))

        erro = "E-mail ou senha inválidos."

    return render_template("login.html", erro=erro)


@app.route("/consultar_protocolo")
def consultar_protocolo():
    return render_template("consultar_protocolo.html")


@app.route("/manifestacao", methods=["POST"])
def criar_manifestacao():
    dados = request.get_json(silent=True) or {}
    tipo_id = str(dados.get("tipo_id", ""))
    tipo = TIPOS.get(tipo_id, "Manifestação")

    with conectar_banco() as conexao:
        protocolo = gerar_protocolo(conexao)
        conexao.execute(
            """
            INSERT INTO manifestacoes (
                protocolo, tipo_id, tipo, titulo, descricao, nome, email,
                telefone, criado_em
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                protocolo,
                tipo_id,
                tipo,
                dados.get("titulo", "").strip(),
                dados.get("descricao", "").strip(),
                dados.get("nome", "").strip(),
                dados.get("email", "").strip(),
                dados.get("telefone", "").strip(),
                datetime.now().isoformat(timespec="seconds"),
            ),
        )

    return jsonify({"protocolo": protocolo}), 201


@app.route("/manifestacoes")
def listar_manifestacoes():
    if not session.get("usuario_logado"):
        return jsonify({"erro": "Não autorizado"}), 401

    with conectar_banco() as conexao:
        linhas = conexao.execute(
            "SELECT * FROM manifestacoes ORDER BY id DESC"
        ).fetchall()

    return jsonify([manifestacao_para_json(linha) for linha in linhas])


@app.route("/manifestacao/<path:protocolo>")
def buscar_manifestacao(protocolo):
    with conectar_banco() as conexao:
        linha = conexao.execute(
            "SELECT * FROM manifestacoes WHERE protocolo = ?",
            (protocolo,),
        ).fetchone()

    if linha is None:
        return jsonify({"erro": "Manifestação não encontrada"}), 404

    return jsonify(manifestacao_para_json(linha))


@app.route("/manifestacao/<path:protocolo>/responder", methods=["PUT"])
def responder_manifestacao(protocolo):
    dados = request.get_json(silent=True) or {}
    resposta = dados.get("resposta", "").strip()

    with conectar_banco() as conexao:
        conexao.execute(
            """
            UPDATE manifestacoes
            SET resposta = ?, status = 'Respondida'
            WHERE protocolo = ?
            """,
            (resposta, protocolo),
        )

    return jsonify({"mensagem": "Resposta registrada com sucesso"})


if __name__ == "__main__":
    app.run(debug=True)
