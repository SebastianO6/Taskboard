# Taskboard: React + Flask + MySQL refresher

React (Vite) -> Flask REST API -> MySQL. Full CRUD on a `tasks` table.

## 1. Database
```bash
mysql -u root -p < backend/schema.sql
```

## 2. Backend (http://localhost:5000)
```bash
cd backend
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env        # then edit DB_PASSWORD
python app.py
```

## 3. Frontend (http://localhost:5173)
```bash
cd frontend
npm install
npm run dev
```
Vite proxies `/api/*` to Flask (see `vite.config.js`), so no CORS fuss in dev.

## API
| Method | Route             | Purpose                              |
|--------|-------------------|--------------------------------------|
| GET    | /api/tasks        | list tasks (optional `?status=done`) |
| POST   | /api/tasks        | create `{title, priority}`           |
| PATCH  | /api/tasks/<id>   | update any of title/priority/done    |
| DELETE | /api/tasks/<id>   | delete                               |

