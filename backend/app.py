import os

import pymysql
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS

load_dotenv()

app = Flask(__name__)
CORS(app)  # handy if you call the API without the Vite proxy

PRIORITIES = {"low", "medium", "high"}


def get_db():
    """Open a new connection per request. Simple, fine for learning."""
    return pymysql.connect(
        host=os.getenv("DB_HOST", "localhost"),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", ""),
        database=os.getenv("DB_NAME", "taskboard"),
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=True,
    )


def fetch_task(cur, task_id):
    cur.execute("SELECT * FROM tasks WHERE id = %s", (task_id,))
    return cur.fetchone()


@app.get("/api/tasks")
def list_tasks():
    status = request.args.get("status")  # 'active' | 'done' | None
    sql = "SELECT * FROM tasks"
    if status == "done":
        sql += " WHERE done = TRUE"
    elif status == "active":
        sql += " WHERE done = FALSE"
    sql += " ORDER BY done, FIELD(priority, 'high', 'medium', 'low'), id DESC"

    conn = get_db()
    try:
        with conn.cursor() as cur:
            cur.execute(sql)
            return jsonify(cur.fetchall())
    finally:
        conn.close()


@app.post("/api/tasks")
def create_task():
    data = request.get_json(silent=True) or {}
    title = (data.get("title") or "").strip()
    priority = data.get("priority", "medium")

    if not title:
        return jsonify(error="Title is required"), 400
    if priority not in PRIORITIES:
        return jsonify(error="Priority must be low, medium or high"), 400

    conn = get_db()
    try:
        with conn.cursor() as cur:
            # %s placeholders = parameterized query, protects against SQL injection
            cur.execute(
                "INSERT INTO tasks (title, priority) VALUES (%s, %s)",
                (title, priority),
            )
            return jsonify(fetch_task(cur, cur.lastrowid)), 201
    finally:
        conn.close()


@app.patch("/api/tasks/<int:task_id>")
def update_task(task_id):
    data = request.get_json(silent=True) or {}
    fields, values = [], []

    if "title" in data:
        title = (data["title"] or "").strip()
        if not title:
            return jsonify(error="Title can't be empty"), 400
        fields.append("title = %s")
        values.append(title)
    if "priority" in data:
        if data["priority"] not in PRIORITIES:
            return jsonify(error="Invalid priority"), 400
        fields.append("priority = %s")
        values.append(data["priority"])
    if "done" in data:
        fields.append("done = %s")
        values.append(bool(data["done"]))

    if not fields:
        return jsonify(error="Nothing to update"), 400

    conn = get_db()
    try:
        with conn.cursor() as cur:
            if not fetch_task(cur, task_id):
                return jsonify(error="Task not found"), 404
            cur.execute(
                f"UPDATE tasks SET {', '.join(fields)} WHERE id = %s",
                (*values, task_id),
            )
            return jsonify(fetch_task(cur, task_id))
    finally:
        conn.close()


@app.delete("/api/tasks/<int:task_id>")
def delete_task(task_id):
    conn = get_db()
    try:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM tasks WHERE id = %s", (task_id,))
            if cur.rowcount == 0:
                return jsonify(error="Task not found"), 404
            return "", 204
    finally:
        conn.close()


@app.errorhandler(pymysql.MySQLError)
def handle_db_error(err):
    app.logger.exception(err)
    return jsonify(error="Database error. Is MySQL running and .env correct?"), 500


if __name__ == "__main__":
    app.run(debug=True, port=5001)
