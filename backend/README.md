# Multi-Role Registration & Commission Backend

Production-oriented backend for:
- supervisor account management
- officer registration workflow
- agent lead submission workflow
- automatic agent↔officer commission matching
- period-based reporting (daily/weekly/monthly)

## Core identity rule

**IDNO (FIN) is globally unique** and is the primary identifier for person records.

- `agent_submissions.idno` is unique globally
- `registrations.idno` is unique globally
- all app writes normalize IDNO to uppercase before saving

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
- Global IDNO lookup endpoint for all authenticated roles

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

- `POST /auth/register` - bootstrap first supervisor (one-time only)
- `POST /auth/login`

Supervisor:
- `POST /supervisor/create-officer`
- `POST /supervisor/create-agent`
- `PATCH /supervisor/agent/:agentId/commission`
- `GET /supervisor/team`
- `GET /supervisor/reports`

Officer:
- `POST /officer/register-user`
- `GET /officer/report/:window(daily|weekly|monthly)`

Agent:
- `POST /agent/submit-person`
- `GET /agent/matches`
- `GET /agent/commission/:window(daily|weekly|monthly)`

Shared (auth required):
- `GET /lookup/idno/:idno`

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

- When an officer creates a registration, the system attempts to match with existing agent submission by `idno`.
- When an agent submits an `idno`, the system also attempts immediate matching against existing registrations.
- Matching is **IDNO(FIN)-only**. `full_name` is stored for display/audit and is not used for matching, so spelling mistakes in names do not block matching.
- Commission is created once, and duplicates are prevented by unique keys in `commission_matches`.

## Included frontend (new)

A standalone role-based frontend is available at `../frontend/`.

Run it locally:

```bash
cd ..
python3 -m http.server 4173
# open http://localhost:4173/frontend/
```

Features:
- login + one-time supervisor bootstrap account creation
- role-based dashboards for supervisor, officer, and agent
- create officer/agent, update commission, run reports, list team
- register users, submit leads, view matches/commission
- global IDNO status lookup panel
- API response log panel for quick debugging

Set the **API Base URL** field in the UI to your backend URL (for example `http://localhost:4000`).
