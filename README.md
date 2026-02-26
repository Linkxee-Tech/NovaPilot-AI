# NovaPilot AI

NovaPilot AI is a full-stack social publishing app with:
- `backend/`: FastAPI + SQLAlchemy + Celery
- `frontend/`: React + Vite + TypeScript

## Quick Start

### 1. Backend
```bash
cd backend
python -m venv venv
```

Activate venv:
- Windows: `venv\Scripts\activate`
- macOS/Linux: `source venv/bin/activate`

Install and run:
```bash
pip install -r requirements.txt
cp .env.example .env   # Windows PowerShell: Copy-Item .env.example .env
uvicorn app.main:app --reload

```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```

## Environment

Backend:
- Copy `backend/.env.example` to `backend/.env`
- For local SQLite: `USE_SQLITE=true`, `DATABASE_URL=sqlite:///./sql_app.db`
- For Postgres: `USE_SQLITE=false`, set `DATABASE_URL` to your DB URI

Frontend:
- Copy `frontend/.env.example` to `frontend/.env`
- Use `VITE_API_URL` for absolute API URL, or leave blank for same-origin `/api/v1`

## Common Commands

Backend tests:
```bash
cd backend
pytest -q
```

Frontend checks:
```bash
cd frontend
npm run lint
npm run build
```

## Deployment

See `DEPLOYMENT.md` for production setup (`systemd`, Nginx, SSL, health checks).

MIT. See `LICENSE.md`.