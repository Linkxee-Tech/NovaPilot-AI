# NovaPilot AI 🚀

NovaPilot AI is a professional, autonomous social media orchestrator. It doesn't just schedule posts—it researches, writes, and publishes content using advanced **Amazon Nova AI** models.

## 🌟 Key Features

- **AI Research Engine**: Autonomous trend discovery and content ideation.
- **Silver Gray Aesthetic**: Premium, high-contrast UI for maximum professional focus.
- **Multi-Platform Support**: Unified dashboard for X (Twitter), LinkedIn, and Facebook.
- **Immutable Auditing**: Every AI action is logged with evidence and integrity hashes.
- **Legal Compliance**: Full Terms of Service and Privacy Policy integration.

---

## 🏗️ Project Structure

- **`backend/`**: FastAPI server, SQLAlchemy models, Celery workers, and utility scripts in `backend/scripts/`.
- **`frontend/`**: Vite + React application with Tailwind CSS.

---

## ⚡ Quick Start

### 1. Prerequisites
- Python 3.11+
- Node.js 18+ (LTS)
- Redis (for Celery workers)
- PostgreSQL (recommended) or SQLite (for local dev)

### 2. Backend Setup
```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate | Mac/Linux: source venv/bin/activate
pip install -r requirements.txt

# Create .env and update keys
cp .env.example .env
uvicorn app.main:app --reload
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## 🚀 Deployment

For production deployment instructions, including environment configuration and reverse proxy setup, please refer to [DEPLOYMENT.md](./DEPLOYMENT.md).

---

## 🛣️ Roadmap

- [x] Multi-platform autonomous posting
- [x] Professional "Silver Gray" theme
- [x] Mandatory legal compliance flow
- [ ] Agentic task decomposition
- [ ] Multi-modal image generation
- [ ] Voice-controlled AI navigation

---

## ⚖️ License

Distributed under the MIT License. See `LICENSE.md` for more information.

© 2026 NovaPilot AI. Built for the autonomous age.
