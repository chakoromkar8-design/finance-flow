import 'dotenv/config'

const env = process.env
const nodeEnv = env.NODE_ENV || 'development'
const isProd = nodeEnv === 'production'
const isTest = nodeEnv === 'test'

function required(name) {
  const value = env[name]
  if (!value) {
    throw new Error(`Missing environment variable ${name}. Copy .env.example to .env and fill it in.`)
  }
  return value
}

const jwtSecret = required('JWT_SECRET')
if (jwtSecret.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters. Generate one with: openssl rand -hex 32')
}

const sessionDays = Number(env.SESSION_DAYS) || 7
const frontendOrigins = (env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim().replace(/\/$/, ''))
  .filter(Boolean)

export const config = {
  nodeEnv,
  isProd,
  isTest,
  port: Number(env.PORT) || 3001,
  frontendOrigins,
  jwtSecret,
  sessionDays,
  cookie: {
    name: 'ff_token',
    httpOnly: true,
    // In production the cookie is only sent over HTTPS.
    secure: isProd,
    // Same-site setups (dev on localhost) can use "lax". If the frontend and API
    // live on different domains in production, the cookie must be SameSite=None.
    sameSite: env.COOKIE_SAMESITE || (isProd ? 'none' : 'lax'),
    path: '/',
    maxAge: sessionDays * 24 * 60 * 60 * 1000,
  },
  bcryptRounds: isTest ? 4 : 12,
  // Minutes ahead of UTC used to decide "today" / "this month" (India = 330).
  tzOffsetMinutes: Number(env.TZ_OFFSET_MINUTES) || 0,
}
