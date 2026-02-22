# Deployment Guide

This guide covers production deployment for NovaPilot AI (FastAPI backend + Vite frontend).

## 1. Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL
- Redis (optional if `REDIS_REQUIRED=false`)
- Nginx
- A Linux host with `systemd`

## 2. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Create `backend/.env` (or update it) with production-safe values:

```env
ENV=production
ALLOWED_ORIGINS=https://your-frontend-domain.example.com
SECRET_KEY=<strong-random-secret>

USE_SQLITE=false
DATABASE_URL=postgresql://<user>:<password>@<host>:5432/<db>

REDIS_URL=redis://<host>:6379/0
REDIS_REQUIRED=true

DEMO_MODE=false
AWS_REGION=us-east-1
AWS_PROFILE=default
USE_AWS_SECRETS=false
```

## 3. Frontend Setup

```bash
cd frontend
npm install
```

Set frontend API URL:

```env
VITE_API_URL=https://your-api-domain.example.com/api/v1
```

Build static assets:

```bash
npm run build
```

## 4. Process Manager (`systemd`)

Use template file:

- `deploy/systemd/novapilot-backend.service.example`

Install it as `/etc/systemd/system/novapilot-backend.service`, then:

```bash
sudo systemctl daemon-reload
sudo systemctl enable novapilot-backend
sudo systemctl start novapilot-backend
sudo systemctl status novapilot-backend
```

## 5. Reverse Proxy (Nginx)

Use template file:

- `deploy/nginx/novapilot.conf.example`

Copy to `/etc/nginx/sites-available/novapilot.conf`, create symlink in `sites-enabled`, then:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 6. SSL/TLS

Install TLS cert with Certbot (example for Ubuntu + Nginx):

```bash
sudo apt-get update
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.example.com -d www.your-domain.example.com
```

## 7. Health Checks

Backend:

```bash
curl -s http://127.0.0.1:8000/health
curl -s http://127.0.0.1:8000/api/v1/health
```

Expected:

- `status` = `healthy`
- `dependencies.database.ok` = `true`
- `dependencies.redis.effective_ok` = `true`

## 8. Final Production Checklist

- [ ] `ENV=production`
- [ ] strong `SECRET_KEY`
- [ ] `ALLOWED_ORIGINS` set to real frontend domain(s)
- [ ] PostgreSQL configured (`USE_SQLITE=false`)
- [ ] Redis configured (or `REDIS_REQUIRED=false` intentionally)
- [ ] Backend running under `systemd` (not `--reload`)
- [ ] Nginx configured
- [ ] SSL certificate active
- [ ] Frontend built with production `VITE_API_URL`
- [ ] `/health` returns `healthy`
