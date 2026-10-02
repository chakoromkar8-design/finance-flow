# FinanceFlow — PROJECT_STATUS

_Last updated: 2026-10-01 — Phase 2 audit and fixes._

## Honest verification summary
| Check | Result |
|---|---|
| Backend tests (`npm test`, 17 tests, fake in-memory Prisma) | PASS (run in my sandbox) |
| Syntax of all 83 JS/JSX files, all relative imports resolve | PASS |
| Mock data no longer used by the app | PASS (`mockData.js` moved to `legacy/`) |
| Real PostgreSQL + Prisma migration | NOT RUN (no Postgres/Prisma/network in my sandbox) |
| `vite build` / browser run of the frontend | NOT RUN (your node_modules has Mac binaries) |
| End-to-end flows in a browser | NOT RUN — you must test (see checklist) |

## What exists
- Backend `server/`: Express 5, JWT (HS256, own implementation in `utils/jwt.js`) in HTTP-only cookie, bcryptjs, origin guard + CORS from FRONTEND_URL, login rate limit, security headers, validators, consistent `{data}` / `{error}` JSON.
- Routes: auth (register/login/logout/me), accounts, transactions, budgets, goals, loans, emis, dashboard (summary, analytics). Every query is scoped to `req.user.id` from the token.
- `prisma/schema.prisma`: User, Account, Transaction (accountId FK), Budget, Goal, Loan, Emi; Decimal money; cuid ids.
- Balances and budget "spent" are computed from transactions, not stored.
- Frontend: `services/api.js` is the single API layer (cookies via `credentials: 'include'`, `VITE_API_URL`), `AuthContext`, `FinanceContext` (no mock fallback; error/retry state), charts read API data.
- Tests: `server/tests/` (auth, protected routes, invalid/expired token, isolation, transaction/account CRUD, budgets, goals, loans/EMI, dashboard, seed).

## Changed in this session
- `BudgetModal.jsx` now imports categories from `utils/categories.js`.
- `src/data/mockData.js` moved to `legacy/mockData.js`.
- Removed `better-sqlite3` from `package.json` (old SQLite server stays in `legacy/sqlite-server`, not runnable without it).
- `.gitignore`: added `*.db` and `legacy/`.

## Remaining / known issues
1. No Prisma migration folder yet — create it with the commands below.
2. `package-lock.json` is out of date (no prisma/dotenv) — `npm install` will refresh it.
3. `README.md` is stale (still says frontend-only/mock data) — rewrite in Phase 3.
4. Tests use a fake Prisma; real-Postgres behaviour (Decimal, Date columns, unique/FK errors) is unverified.
5. JWT is a small in-house HS256 implementation (correct per RFC 7519, tested); swap to `jsonwebtoken` if you prefer a library.
6. Rate limiter is in-memory (single process only).

## Commands (macOS)
```
brew install postgresql@16 && brew services start postgresql@16
createdb financeflow
cp .env.example .env            # set JWT_SECRET: openssl rand -hex 32
cp .env.local.example .env.local
npm install
npx prisma migrate dev --name init
npm run db:seed                 # optional demo user (demo@financeflow.com)
npm test
npm run server:dev              # terminal 1
npm run dev                     # terminal 2 -> http://localhost:5173
```

## Next (Phase 3, after your go-ahead)
Run the real DB + browser verification, fix what breaks, update README, deployment notes.
