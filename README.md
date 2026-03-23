# Backend — QuickTools API

A minimal Express.js backend for QuickTools. Designed for clean architecture and easy future expansion.

## Stack

- Node.js (≥18)
- Express.js
- dotenv
- cors
- nodemon (dev)

## Folder Structure

```
backend/
├── src/
│   ├── config/         # Environment and app config
│   ├── controllers/    # Request/response handlers
│   ├── middlewares/    # Error handling, not-found, etc.
│   ├── routes/         # Route definitions
│   ├── services/       # Business logic (future tools API)
│   ├── utils/          # Helper functions
│   ├── app.js          # Express app setup
│   └── server.js       # Server entry point
├── .env.example
└── package.json
```

## Setup

```bash
cd backend
npm install
cp .env.example .env
```

## Running

```bash
# Development (auto-reload)
npm run dev

# Production
npm start
```

## API Endpoints

| Method | Endpoint     | Description        |
|--------|--------------|--------------------|
| GET    | /api/health  | Health check       |

### Health Check Response

```json
{
  "success": true,
  "message": "QuickTools API is running",
  "timestamp": "2026-01-01T00:00:00.000Z"
}
```

## Future Development

- Add `/api/pdf/*` endpoints for PDF processing (pdf-lib, pdf-merger-js)
- Add `/api/image/*` endpoints for image processing (sharp)
- Add rate limiting middleware
- Add request logging (morgan)
