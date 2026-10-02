import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { ApiError } from '../utils/errors.js'
import { signToken } from '../utils/jwt.js'
import { setAuthCookie, clearAuthCookie } from '../utils/cookies.js'
import { Validator } from '../validators/common.js'
import { requireAuth } from '../middleware/auth.js'
import { createRateLimiter } from '../middleware/security.js'

// A real bcrypt hash of a random string. When the email doesn't exist we still
// compare against it, so "unknown email" and "wrong password" take equally long.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 4)

const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email })

export function authRoutes({ prisma, config }) {
  const router = Router()
  const limiter = createRateLimiter(config.authRateLimit ?? { max: 10, windowMs: 15 * 60 * 1000 })

  const startSession = (res, user) => {
    const token = signToken({ sub: user.id }, config.jwtSecret, { expiresInSeconds: config.sessionDays * 24 * 60 * 60 })
    setAuthCookie(res, config, token)
  }

  router.post('/register', async (req, res) => {
    const v = new Validator(req.body ?? {})
    v.string('name', { max: 80, label: 'Name' }).email('email')
    const password = req.body?.password
    if (typeof password !== 'string' || password.length < 8) v.fail('password', 'Password must be at least 8 characters.')
    else if (password.length > 72) v.fail('password', 'Password must be at most 72 characters.')
    else if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) v.fail('password', 'Password must contain at least one letter and one number.')
    const data = v.done()

    const existing = await prisma.user.findUnique({ where: { email: data.email } })
    if (existing) throw new ApiError(409, 'An account with this email already exists.', { code: 'EMAIL_TAKEN', fields: { email: 'This email is already registered.' } })

    const passwordHash = await bcrypt.hash(password, config.bcryptRounds)
    const user = await prisma.user.create({ data: { name: data.name, email: data.email, passwordHash } })
    startSession(res, user)
    res.status(201).json({ data: { user: publicUser(user) } })
  })

  router.post('/login', async (req, res) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : ''
    const password = typeof req.body?.password === 'string' ? req.body.password : ''
    if (!email || !password) throw new ApiError(400, 'Email and password are required.', { code: 'VALIDATION' })

    const key = `${req.ip}:${email}`
    limiter.check(key)

    const user = await prisma.user.findUnique({ where: { email } })
    const ok = await bcrypt.compare(password.slice(0, 72), user?.passwordHash ?? DUMMY_HASH)
    if (!user || !ok) {
      limiter.fail(key)
      throw new ApiError(401, 'Invalid email or password.', { code: 'INVALID_CREDENTIALS' })
    }

    limiter.reset(key)
    startSession(res, user)
    res.json({ data: { user: publicUser(user) } })
  })

  router.post('/logout', (req, res) => {
    clearAuthCookie(res, config)
    res.json({ data: { ok: true } })
  })

  router.get('/me', requireAuth({ prisma, config }), (req, res) => {
    res.json({ data: { user: req.user } })
  })

  return router
}
