import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { startServer, registerUser } from './helpers.js'
import { signToken } from '../utils/jwt.js'

let s
before(async () => { s = await startServer() })
after(async () => { await s.close() })

test('register creates a user, hashes the password and sets an HTTP-only cookie', async () => {
  const c = s.client()
  const res = await c.post('/auth/register', { name: 'Asha', email: 'Asha@Example.com', password: 'Secret123' })
  assert.equal(res.status, 201)
  assert.deepEqual(Object.keys(res.data.user).sort(), ['email', 'id', 'name'])
  assert.equal(res.data.user.email, 'asha@example.com')
  assert.ok(!JSON.stringify(res.body).includes('Secret123'))
  assert.ok(!JSON.stringify(res.body).toLowerCase().includes('hash'))
  const stored = s.prisma._tables.user.find((u) => u.email === 'asha@example.com')
  assert.notEqual(stored.passwordHash, 'Secret123')
  assert.match(stored.passwordHash, /^\$2[aby]\$/)
  const cookie = res.setCookies.find((x) => x.startsWith('ff_token='))
  assert.match(cookie, /HttpOnly/i)
  assert.match(cookie, /SameSite=Lax/i)
  assert.match(cookie, /Max-Age=\d+/i)
})

test('register validation and duplicate email', async () => {
  const c = s.client()
  let res = await c.post('/auth/register', { name: '', email: 'nope', password: 'short' })
  assert.equal(res.status, 400)
  assert.ok(res.error.fields.name && res.error.fields.email && res.error.fields.password)
  res = await c.post('/auth/register', { name: 'A', email: 'a@b.co', password: 'onlyletters' })
  assert.equal(res.status, 400)
  assert.ok(res.error.fields.password)
  await c.post('/auth/register', { name: 'Dup', email: 'dup@example.com', password: 'Passw0rd1' })
  res = await c.post('/auth/register', { name: 'Dup2', email: 'DUP@example.com', password: 'Passw0rd1' })
  assert.equal(res.status, 409)
  assert.equal(res.error.code, 'EMAIL_TAKEN')
})

test('login: success, wrong password and unknown email look identical', async () => {
  const { email } = await registerUser(s)
  const c = s.client()
  const ok = await c.post('/auth/login', { email, password: 'Passw0rd!x' })
  assert.equal(ok.status, 200)
  assert.ok(ok.setCookies.some((x) => x.startsWith('ff_token=')))
  const bad = await s.client().post('/auth/login', { email, password: 'wrong-password' })
  const unknown = await s.client().post('/auth/login', { email: 'nobody@example.com', password: 'whatever123' })
  assert.equal(bad.status, 401)
  assert.equal(unknown.status, 401)
  assert.equal(bad.error.message, 'Invalid email or password.')
  assert.equal(unknown.error.message, bad.error.message)
})

test('login is rate limited after repeated failures', async () => {
  const { email } = await registerUser(s)
  const c = s.client()
  for (let i = 0; i < 5; i += 1) assert.equal((await c.post('/auth/login', { email, password: 'bad-password' })).status, 401)
  assert.equal((await c.post('/auth/login', { email, password: 'bad-password' })).status, 429)
  // even the right password is blocked while the limit is active
  assert.equal((await c.post('/auth/login', { email, password: 'Passw0rd!x' })).status, 429)
})

test('/auth/me needs a cookie; logout clears it', async () => {
  const anon = await s.client().get('/auth/me')
  assert.equal(anon.status, 401)
  const { c, user } = await registerUser(s)
  const me = await c.get('/auth/me')
  assert.equal(me.status, 200)
  assert.equal(me.data.user.id, user.id)
  const out = await c.post('/auth/logout')
  assert.equal(out.status, 200)
  assert.match(out.setCookies.find((x) => x.startsWith('ff_token=')), /Expires=Thu, 01 Jan 1970/i)
  assert.equal((await c.get('/auth/me')).status, 401)
})

test('invalid, tampered, wrong-secret, alg=none and expired tokens are rejected', async () => {
  const { user } = await registerUser(s)
  const check = async (token) => {
    const c = s.client()
    c.setCookie(`ff_token=${token}`)
    return c.get('/accounts')
  }
  assert.equal((await check('garbage')).status, 401)
  assert.equal((await check('a.b.c')).status, 401)

  const good = signToken({ sub: user.id }, s.config.jwtSecret, { expiresInSeconds: 60 })
  assert.equal((await check(good)).status, 200)

  const [h, , sig] = good.split('.')
  const forgedBody = Buffer.from(JSON.stringify({ sub: 'someone-else', iat: 1, exp: 9999999999 })).toString('base64url')
  assert.equal((await check(`${h}.${forgedBody}.${sig}`)).status, 401)

  const wrongSecret = signToken({ sub: user.id }, 'another-secret-another-secret-another-secret', { expiresInSeconds: 60 })
  assert.equal((await check(wrongSecret)).status, 401)

  const none = `${Buffer.from('{"alg":"none","typ":"JWT"}').toString('base64url')}.${Buffer.from(JSON.stringify({ sub: user.id, exp: 9999999999 })).toString('base64url')}.`
  assert.equal((await check(none)).status, 401)

  const expired = signToken({ sub: user.id }, s.config.jwtSecret, { expiresInSeconds: -10 })
  const res = await check(expired)
  assert.equal(res.status, 401)
  assert.equal(res.error.code, 'TOKEN_EXPIRED')

  const ghost = signToken({ sub: 'deleted-user-id' }, s.config.jwtSecret, { expiresInSeconds: 60 })
  assert.equal((await check(ghost)).status, 401)
})

test('every finance endpoint rejects anonymous requests', async () => {
  const c = s.client()
  const paths = ['/accounts', '/transactions', '/budgets', '/goals', '/loans', '/emis', '/dashboard/summary', '/dashboard/analytics']
  for (const p of paths) assert.equal((await c.get(p)).status, 401, p)
  assert.equal((await c.post('/transactions', {})).status, 401)
  assert.equal((await c.put('/accounts/abc', {})).status, 401)
  assert.equal((await c.del('/goals/abc')).status, 401)
})

test('bad Origin on a write is refused; allowed origin gets CORS credentials; bad JSON is a 400', async () => {
  const c = s.client()
  const evil = await c.post('/auth/login', { email: 'a@b.co', password: 'x' }, { headers: { Origin: 'https://evil.example' } })
  assert.equal(evil.status, 403)
  const res = await fetch(`${s.base}/api/health`, { headers: { Origin: 'http://localhost:5173' } })
  assert.equal(res.headers.get('access-control-allow-origin'), 'http://localhost:5173')
  assert.equal(res.headers.get('access-control-allow-credentials'), 'true')
  const other = await fetch(`${s.base}/api/health`, { headers: { Origin: 'https://evil.example' } })
  assert.equal(other.headers.get('access-control-allow-origin'), null)
  const bad = await c.send('POST', '/auth/login', '{not json', { raw: true })
  assert.equal(bad.status, 400)
  assert.equal(bad.error.code, 'INVALID_JSON')
})
