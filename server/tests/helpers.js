import { createApp } from '../app.js'
import { createFakePrisma } from './fakePrisma.js'
import { shiftMonth } from '../utils/dates.js'

export const testConfig = (overrides = {}) => ({
  nodeEnv: 'test',
  isProd: false,
  isTest: true,
  port: 0,
  frontendOrigins: ['http://localhost:5173'],
  jwtSecret: 'test-secret-that-is-at-least-32-characters-long',
  sessionDays: 7,
  cookie: { name: 'ff_token', httpOnly: true, secure: false, sameSite: 'lax', path: '/', maxAge: 7 * 86400 * 1000 },
  bcryptRounds: 4,
  tzOffsetMinutes: 0,
  authRateLimit: { max: 5, windowMs: 60_000 },
  ...overrides,
})

export async function startServer(configOverrides) {
  const prisma = createFakePrisma()
  const config = testConfig(configOverrides)
  const app = createApp({ prisma, config })
  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s))
  })
  const base = `http://127.0.0.1:${server.address().port}`
  return { prisma, config, base, close: () => new Promise((r) => server.close(r)), client: () => createClient(base) }
}

// A tiny fetch wrapper that remembers cookies, like a browser tab would.
export function createClient(base) {
  let cookie = ''
  const api = async (method, path, body, { headers = {}, raw = false } = {}) => {
    const res = await fetch(`${base}/api${path}`, {
      method,
      headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}), ...headers },
      body: body === undefined ? undefined : typeof body === 'string' && raw ? body : JSON.stringify(body),
    })
    const setCookies = res.headers.getSetCookie?.() ?? []
    for (const sc of setCookies) {
      const [pair] = sc.split(';')
      const [name, value] = pair.split('=')
      if (/Expires=Thu, 01 Jan 1970/i.test(sc) || value === '') cookie = cookie.split('; ').filter((c) => !c.startsWith(`${name}=`)).join('; ')
      else cookie = [...cookie.split('; ').filter((c) => c && !c.startsWith(`${name}=`)), pair].join('; ')
    }
    let json = null
    try {
      json = await res.json()
    } catch {
      /* no body */
    }
    return { status: res.status, body: json, data: json?.data, error: json?.error, setCookies, headers: res.headers }
  }
  return {
    get: (p, o) => api('GET', p, undefined, o),
    post: (p, b, o) => api('POST', p, b ?? {}, o),
    put: (p, b, o) => api('PUT', p, b ?? {}, o),
    del: (p, o) => api('DELETE', p, undefined, o),
    send: api,
    setCookie: (c) => { cookie = c },
    get cookie() { return cookie },
  }
}

let counter = 0
export async function registerUser(server, name = 'Test User') {
  const c = server.client()
  const email = `user${++counter}@example.com`
  const res = await c.post('/auth/register', { name, email, password: 'Passw0rd!x' })
  if (res.status !== 201) throw new Error(`register failed: ${JSON.stringify(res.body)}`)
  return { c, email, user: res.data.user }
}

export const today = () => new Date().toISOString().slice(0, 10)
export const thisMonth = () => today().slice(0, 7)
export const lastMonthDay = (day = '15') => `${shiftMonth(thisMonth(), -1)}-${day}`

export async function makeAccount(c, over = {}) {
  const res = await c.post('/accounts', { name: `Acc ${Math.random().toString(36).slice(2, 7)}`, type: 'SAVINGS', openingBalance: 1000, ...over })
  if (res.status !== 201) throw new Error(`account failed: ${JSON.stringify(res.body)}`)
  return res.data
}

export async function makeTx(c, accountId, over = {}) {
  const res = await c.post('/transactions', { type: 'expense', amount: 100, category: 'Food', description: 'Lunch', date: today(), accountId, ...over })
  if (res.status !== 201) throw new Error(`tx failed: ${JSON.stringify(res.body)}`)
  return res.data
}
