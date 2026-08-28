# SpeedMath Pro Frontend
The frontend is a responsive, dependency-free SPA served by the existing Express app.

## Connected API endpoints
- GET `/api/health`
- GET `/api/config` (added public-safe runtime game and leaderboard parameters)
- POST `/api/auth/signup`
- POST `/api/auth/login`
- POST `/api/auth/refresh`
- POST `/api/auth/logout`
- POST `/api/scores`
- GET `/api/leaderboard`
- GET `/api/profile/me`
- GET `/api/profile/me/scores`

## Existing backend parameters exposed to gameplay
The UI consumes `GAME_DURATION_SECONDS`, `MAX_SCORE_PER_GAME`, and `MIN_SECONDS_BETWEEN_SUBMISSIONS` through `/api/config`. It also displays leaderboard pagination limits. Secret/server-only settings such as database credentials, JWT secrets, bcrypt cost, cookie security, and rate-limit internals are intentionally not sent to the browser.

## Run
npm install
cp example.env .env
npm run migrate
npm run dev

Open http://localhost:3000
