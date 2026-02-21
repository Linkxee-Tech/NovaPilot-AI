# Deployment Documentation

This document provides instructions for deploying NovaPilot AI, including both the backend and frontend components.

## Prerequisites
- **Node.js**: v18 or later
- **Python**: v3.10 or later
- **PostgreSQL**: Optional (can use SQLite for quick deployments)
- **Redis**: Recommended for production automation tasks

## Backend Deployment (FastAPI)

1. **Environment Setup**:
   - Navigate to the `backend` directory.
   - Create a virtual environment: `python -m venv venv`
   - Activate it: `source venv/bin/activate` or `venv\Scripts\activate`
   - Install dependencies: `pip install -r requirements.txt`

2. **Configuration**:
   - Rename `.env.example` to `.env` if it doesn't exist.
   - Update `SECRET_KEY` and database credentials.
   - Set `USE_SQLITE=true` for local development or small-scale deployments.

3. **Running the Server**:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```

## Frontend Deployment (Vite + React)

1. **Environment Setup**:
   - Navigate to the `frontend` directory.
   - Install dependencies: `npm install`

2. **Configuration**:
   - Ensure `.env` has the correct `VITE_API_URL` pointing to your backend.

3. **Build and Serve**:
   - Create a production build: `npm run build`
   - The output will be in the `dist` folder.
   - Serve the `dist` folder using a static file server (Nginx, Vercel, Netlify, etc.).

## Production Checklist
- [ ] Change the `SECRET_KEY` in the backend `.env`.
- [ ] Use a production-grade database (PostgreSQL).
- [ ] Configure a reverse proxy like Nginx to serve the frontend and proxy API requests.
- [ ] Enable SSL/TLS for secure communication.

## Support

For technical support or feature requests, please refer to the internal documentation or contact the development team.

© 2026 NovaPilot AI.
