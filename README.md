# Speed Math — Leaderboard Game (full backend)

A production-style leaderboard game: Node/Express API + PostgreSQL, real JWT
auth (access + refresh tokens), bcrypt password hashing, rate limiting,
server-side score validation, and a static frontend that talks to it.

## Stack
- **Backend:** Node.js, Express
- **Database:** PostgreSQL (via `pg`)
- **Auth:** JWT access tokens + rotating refresh tokens (httpOnly cookie), bcrypt
- **Security:** helmet, cors, express-rate-limit, express-validator
- **Frontend:** static HTML/CSS/JS in `public/`, calls the API with `fetch`

## Setup

```bash
npm install
cp example.env .env
# edit .env — set DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET at minimum

npm run migrate     # creates tables/views in your Postgres database
npm run seed        # optional: adds demo users (alice/bob/carol, password: password123)

npm run dev          # nodemon, or `npm start` for plain node
```

Visit `http://localhost:3000`.

## Build

There's no compile/bundle step — the backend runs directly on Node.js and the
frontend in `public/` is plain HTML/CSS/JS served as static files. "Build" is
just installing dependencies:

```bash
npm install        # installs backend deps from package-lock.json
npm run migrate     # applies src/db/schema.sql
```

`npm start` runs the built server; `npm run dev` runs it under nodemon for
local development.

## Tests

```bash
npm test
```

Runs the Node.js built-in test runner (`node --test`) against `test/*.test.js`.
These cover the token utilities (`src/utils/tokens.js`) and the parts of the
HTTP API that don't require a live database connection: health/config
endpoints, the 404 handler, and input validation on auth/leaderboard routes.
They do not exercise the database-backed paths (signup/login persistence,
score writes, leaderboard queries) — that needs a running Postgres instance
per the Setup section above.

## All configurable parameters (`.env`)

| Variable | Purpose | Default |
|---|---|---|
| `PORT` | HTTP port | `3000` |
| `NODE_ENV` | environment | `development` |
| `CLIENT_ORIGIN` | CORS allowed origin | `http://localhost:3000` |
| `DATABASE_URL` | Postgres connection string | — |
| `DB_SSL` | enable SSL for DB connection | `false` |
| `DB_POOL_MAX` | max pool connections | `10` |
| `DB_IDLE_TIMEOUT_MS` | idle client timeout | `30000` |
| `JWT_SECRET` | access token signing secret | — |
| `JWT_EXPIRES_IN` | access token lifetime | `7d` |
| `JWT_REFRESH_SECRET` | refresh token signing secret | — |
| `JWT_REFRESH_EXPIRES_IN` | refresh token lifetime | `30d` |
| `BCRYPT_SALT_ROUNDS` | password hash cost factor | `12` |
| `COOKIE_SECURE` | require HTTPS for cookies | `false` |
| `RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_MAX_REQUESTS` | general API rate limit | 15 min / 100 |
| `AUTH_RATE_LIMIT_WINDOW_MS` / `AUTH_RATE_LIMIT_MAX_REQUESTS` | login/signup rate limit | 15 min / 10 |
| `SCORE_RATE_LIMIT_WINDOW_MS` / `SCORE_RATE_LIMIT_MAX_REQUESTS` | score submission rate limit | 1 min / 15 |
| `GAME_DURATION_SECONDS` | round length | `30` |
| `MAX_SCORE_PER_GAME` | server-side score ceiling (anti-cheat) | `60` |
| `MIN_SECONDS_BETWEEN_SUBMISSIONS` | minimum gap between score submissions per user | `25` |
| `LEADERBOARD_DEFAULT_LIMIT` / `LEADERBOARD_MAX_LIMIT` | pagination defaults | `20` / `100` |

## API reference

### Auth
- `POST /api/auth/signup` — `{ username, email, password }` → `{ user, accessToken }`, sets `refresh_token` cookie
- `POST /api/auth/login` — `{ username, password }` → `{ user, accessToken }`
- `POST /api/auth/refresh` — reads `refresh_token` cookie → `{ accessToken }`
- `POST /api/auth/logout` — requires auth, revokes refresh token

### Scores
- `POST /api/scores` — requires auth. `{ score, durationSeconds?, gameId? }`
  Validated server-side (range-checked, rate-limited, minimum interval enforced) so
  a client can't just POST an arbitrarily high score.

### Leaderboard
- `GET /api/leaderboard?period=alltime|weekly|daily&limit=20&offset=0&gameId=speed_math`
  Returns each player's best score in the period, ranked.

### Profile
- `GET /api/profile/me` — requires auth, returns account info
- `GET /api/profile/me/scores?limit=15` — requires auth, returns stats + score history

### Health
- `GET /api/health`

## Database schema
See `src/db/schema.sql` — `users`, `refresh_tokens`, `games`, `scores` tables,
indexes on hot columns, and a `best_scores_all_time` view.

## Anti-cheat notes
Scores are never trusted from the client beyond validation: they're bounded by
`MAX_SCORE_PER_GAME`, rate-limited per user, and throttled by
`MIN_SECONDS_BETWEEN_SUBMISSIONS` so a script can't spam submissions faster
than a real game round could produce them. For a real production deployment
you'd add a signed session per game round (start round → server issues a
token → submit must include it) to fully close the gap — noted here as the
next hardening step, not yet implemented.

## Deploying
Any Node host works (Render, Railway, Fly.io, a VPS). Point `DATABASE_URL` at
a managed Postgres instance (Supabase, Neon, RDS, etc.), set real secrets for
`JWT_SECRET`/`JWT_REFRESH_SECRET`, set `COOKIE_SECURE=true` and `DB_SSL=true`
behind HTTPS, and run `npm run migrate` once against the production database.
