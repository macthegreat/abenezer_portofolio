# Multi-Role Registration & Commission Backend

Production-oriented backend for:
- supervisor account management
- officer registration workflow
- agent lead submission workflow
- automatic agent↔officer commission matching
- period-based reporting (daily/weekly/monthly)

## What's production-ready now

- Request validation middleware for all write endpoints and report windows
- Transactional writes for multi-step operations
- Structured API errors (validation + mapped PostgreSQL constraint errors)
- Security middleware: `helmet`, CORS policy, rate limiting
- Request logging with `morgan`
- Request ID propagation (`x-request-id`) for observability
- Health and readiness endpoints (`/health`, `/ready`)
- Graceful shutdown handling (`SIGINT`, `SIGTERM`)
- Supervisor endpoint to update agent commission

## Quick start

1. Install dependencies:
   ```bash
   cd backend
   npm install
   ```
2. Create `.env` file:
   ```bash
   NODE_ENV=production
   PORT=4000
   DATABASE_URL=postgres://postgres:postgres@localhost:5432/commission_db
   JWT_SECRET=replace_me_with_a_long_random_secret
   DB_SSL=false

   # Security and operations
   CORS_ORIGINS=https://your-admin.example.com,https://your-app.example.com
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX=300
   LOG_FORMAT=combined
   ```
3. Create database schema:
   ```bash
   psql "$DATABASE_URL" -f database/schema.sql
   ```
4. Run server:
   ```bash
   npm start
   ```

## API map

- `POST /auth/register` - bootstrap supervisor account
- `POST /auth/login`

Supervisor:
- `POST /supervisor/create-officer`
- `POST /supervisor/create-agent`
- `PATCH /supervisor/agent/:agentId/commission`
- `GET /supervisor/reports`

Officer:
- `POST /officer/register-user`
- `GET /officer/report/:window(daily|weekly|monthly)`

Agent:
- `POST /agent/submit-person`
- `GET /agent/matches`
- `GET /agent/commission/:window(daily|weekly|monthly)`

Ops:
- `GET /health`
- `GET /ready`

## Error format

Known errors return:

```json
{
  "message": "Human readable message",
  "details": {
    "constraint": "optional_db_constraint",
    "detail": "optional_database_detail"
  },
  "requestId": "correlation-id"
}
```

## Matching logic

When an officer creates a registration, the service checks `agent_submissions` by `idno`.
If found, it inserts one row into `commission_matches` with that agent's configured `commission_per_person`.
