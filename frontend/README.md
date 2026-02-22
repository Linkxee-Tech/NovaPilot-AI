# Frontend

React + TypeScript + Vite frontend for NovaPilot AI.

## Setup

```bash
npm install
npm run dev
```

## Environment Variables

Use `frontend/.env`:

- `VITE_API_URL` (optional): Absolute API base URL including `/api/v1`
  - Example: `https://api.example.com/api/v1`
  - Leave empty to use same-origin `/api/v1`
- `VITE_DEV_PROXY_TARGET` (dev only): Backend target for Vite proxy
  - Example: `http://127.0.0.1:8000`

## Scripts

- `npm run dev`: Start Vite dev server
- `npm run lint`: Run ESLint
- `npm run build`: Type-check and build production assets

## Notes

- Dev server proxies `/api/v1` and `/uploads` to `VITE_DEV_PROXY_TARGET`.
- WebSocket logs use `VITE_API_URL` when set, otherwise same-origin `/api/v1`.
