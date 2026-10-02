// Minimal HS256 JSON Web Token (RFC 7519) using only Node's built-in crypto.
//
// Format:  base64url(header) . base64url(payload) . base64url(signature)
// The signature is HMAC-SHA256 over "header.payload" with JWT_SECRET, so nobody
// without the secret can create or change a token. `exp` makes it expire.
import crypto from 'node:crypto'

const b64 = (input) => Buffer.from(input).toString('base64url')
const sign = (data, secret) => crypto.createHmac('sha256', secret).update(data).digest('base64url')

export function signToken(payload, secret, { expiresInSeconds }) {
  const iat = Math.floor(Date.now() / 1000)
  const header = b64(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = b64(JSON.stringify({ ...payload, iat, exp: iat + expiresInSeconds }))
  return `${header}.${body}.${sign(`${header}.${body}`, secret)}`
}

// Returns the payload, or throws an Error whose message says why it failed.
export function verifyToken(token, secret) {
  if (typeof token !== 'string') throw new Error('malformed')
  const parts = token.split('.')
  if (parts.length !== 3) throw new Error('malformed')
  const [header, body, signature] = parts

  let parsedHeader
  try {
    parsedHeader = JSON.parse(Buffer.from(header, 'base64url').toString())
  } catch {
    throw new Error('malformed')
  }
  // Only accept the algorithm we issue (blocks the classic "alg: none" attack).
  if (parsedHeader.alg !== 'HS256') throw new Error('bad algorithm')

  const expected = Buffer.from(sign(`${header}.${body}`, secret))
  const given = Buffer.from(signature)
  if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) {
    throw new Error('bad signature')
  }

  let payload
  try {
    payload = JSON.parse(Buffer.from(body, 'base64url').toString())
  } catch {
    throw new Error('malformed')
  }
  if (typeof payload.exp !== 'number' || payload.exp <= Math.floor(Date.now() / 1000)) {
    throw new Error('expired')
  }
  return payload
}
