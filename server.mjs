import { createServer } from 'node:http'
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { dirname, extname, resolve } from 'node:path'

const scrypt = promisify(scryptCallback)
const port = Number(process.env.API_PORT || 3001)
const dataPath = resolve(process.env.PORTAL_DATA_FILE || 'data/portal-data.json')
const staticRoot = resolve('dist')
const sessionLifetime = 1000 * 60 * 60 * 24 * 7
const sessions = new Map()
const authRequestLimits = new Map()
let database = { colleges: [], users: [] }
let saveQueue = Promise.resolve()
let registrationQueue = Promise.resolve()

async function loadDatabase() {
  try {
    const contents = await readFile(dataPath, 'utf8')
    const parsed = JSON.parse(contents)
    if (!Array.isArray(parsed.colleges) || !Array.isArray(parsed.users)) throw new Error('Invalid portal database format.')
    database = parsed
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error
    await mkdir(dirname(dataPath), { recursive: true })
    await persistDatabase()
  }
  await seedDevelopmentAccounts()
}

async function seedDevelopmentAccounts() {
  if (process.env.PORTAL_DEMO_LOGIN !== 'true') return

  const collegeCode = 'DEMO-COLLEGE'
  let college = database.colleges.find((item) => item.code === collegeCode)
  if (!college) {
    college = { id: 'development-demo-college', name: 'Demo College', code: collegeCode, createdAt: new Date().toISOString() }
    database.colleges.push(college)
  }

  const demoAccounts = [
    { role: 'principal', displayName: 'Demo Principal', email: 'principal.demo@college.test', department: '', password: 'DemoPortal!2026' },
    { role: 'hod', displayName: 'Demo HOD', email: 'hod.demo@college.test', department: 'Information Technology', password: 'DemoPortal!2026' },
    { role: 'staff', displayName: 'Demo In-Charge', email: 'incharge.demo@college.test', department: 'Information Technology', staffType: 'in-charge', password: 'DemoPortal!2026' },
    { role: 'staff', displayName: 'Demo Staff', email: 'staff.demo@college.test', department: 'Information Technology', staffType: 'staff', password: 'DemoPortal!2026' },
    { role: 'student', displayName: 'Demo Student', email: 'student.demo@college.test', department: '', password: 'DemoPortal!2026' },
  ]

  for (const account of demoAccounts) {
    if (database.users.some((user) => user.email === account.email)) continue
    database.users.push({
      id: `development-${account.role}-${account.email}`,
      collegeId: college.id,
      role: account.role,
      displayName: account.displayName,
      email: account.email,
      department: account.department,
      ...(account.role === 'staff' ? { staffType: account.staffType } : {}),
      passwordHash: await createPasswordHash(account.password),
      createdAt: new Date().toISOString(),
    })
  }
}

function persistDatabase() {
  const snapshot = JSON.stringify(database, null, 2)
  saveQueue = saveQueue.catch(() => {}).then(async () => {
    const temporaryPath = `${dataPath}.${process.pid}.tmp`
    await writeFile(temporaryPath, snapshot, { mode: 0o600 })
    await rename(temporaryPath, dataPath)
  })
  return saveQueue
}

function sendJson(response, statusCode, payload, headers = {}) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...headers,
  })
  response.end(JSON.stringify(payload))
}

function sendText(response, statusCode, contentType, content) {
  response.writeHead(statusCode, { 'Content-Type': contentType, 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY' })
  response.end(content)
}

function siteOrigin(request) {
  const configured = process.env.PUBLIC_SITE_URL
  if (configured) {
    const origin = new URL(configured)
    if (origin.protocol !== 'https:' && process.env.NODE_ENV === 'production') throw new Error('PUBLIC_SITE_URL must use HTTPS in production.')
    return origin.origin
  }
  if (process.env.NODE_ENV === 'production') return null
  const host = request.headers.host || 'localhost:5173'
  const forwardedProtocol = request.headers['x-forwarded-proto']
  const protocol = forwardedProtocol === 'https' ? 'https' : 'http'
  return new URL(`${protocol}://${host}`).origin
}

function applyAuthRateLimit(request, response, route) {
  const now = Date.now()
  const windowMs = 15 * 60 * 1000
  const address = request.socket.remoteAddress || 'unknown'
  const key = `${address}:${route}`
  const current = authRequestLimits.get(key)
  const limit = route.endsWith('/register') ? 5 : 12
  const bucket = !current || current.resetAt <= now ? { count: 0, resetAt: now + windowMs } : current
  bucket.count += 1
  authRequestLimits.set(key, bucket)
  if (authRequestLimits.size > 1000) {
    for (const [entry, value] of authRequestLimits) if (value.resetAt <= now) authRequestLimits.delete(entry)
  }
  if (bucket.count <= limit) return false
  const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))
  sendJson(response, 429, { success: false, code: 'RATE_LIMITED' }, { 'Retry-After': String(retryAfter) })
  return true
}

function isHoneypotFilled(body) {
  return typeof body.website === 'string' && body.website.trim().length > 0
}

async function readJson(request) {
  let body = ''
  for await (const chunk of request) {
    body += chunk
    if (body.length > 16_384) {
      const error = new Error('Request body is too large.')
      error.status = 413
      throw error
    }
  }
  try {
    return body ? JSON.parse(body) : {}
  } catch {
    const error = new Error('Request body must be valid JSON.')
    error.status = 400
    throw error
  }
}

function normalizeEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

function normalizeCode(value) {
  return typeof value === 'string' ? value.trim().toUpperCase() : ''
}

function safeUser(user) {
  const college = database.colleges.find((item) => item.id === user.collegeId)
  return {
    id: user.id,
    role: user.role,
    displayName: user.displayName,
    email: user.email,
    department: user.department,
    staffType: user.role === 'staff' ? user.staffType || 'staff' : undefined,
    collegeName: college?.name ?? '',
    collegeCode: college?.code ?? '',
  }
}

function cookieValue(request, name) {
  const cookieHeader = request.headers.cookie ?? ''
  for (const part of cookieHeader.split(';')) {
    const [key, ...value] = part.trim().split('=')
    if (key === name) return decodeURIComponent(value.join('='))
  }
  return null
}

function sessionUser(request) {
  const sessionId = cookieValue(request, 'portal_session')
  const session = sessionId ? sessions.get(sessionId) : null
  if (!session || session.expiresAt < Date.now()) {
    if (sessionId) sessions.delete(sessionId)
    return null
  }
  return database.users.find((user) => user.id === session.userId) ?? null
}

function sessionCookie(sessionId, maxAge) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  return `portal_session=${encodeURIComponent(sessionId)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}${secure}`
}

async function createPasswordHash(password) {
  const salt = randomBytes(16)
  const derivedKey = await scrypt(password, salt, 64)
  return `${salt.toString('hex')}:${derivedKey.toString('hex')}`
}

async function passwordMatches(password, storedHash) {
  const [saltHex, keyHex] = storedHash.split(':')
  if (!saltHex || !keyHex) return false
  const expected = Buffer.from(keyHex, 'hex')
  const actual = await scrypt(password, Buffer.from(saltHex, 'hex'), expected.length)
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}

function validatePassword(password) {
  return typeof password === 'string' && password.length >= 8 && password.length <= 128
}

function validEmail(email) {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function makeCollegeCode() {
  return `SBC-${randomBytes(6).toString('hex').toUpperCase()}`
}

async function createSession(response, user) {
  const sessionId = randomBytes(32).toString('hex')
  sessions.set(sessionId, { userId: user.id, expiresAt: Date.now() + sessionLifetime })
  sendJson(response, 200, { success: true, user: safeUser(user) }, {
    'Set-Cookie': sessionCookie(sessionId, sessionLifetime / 1000),
  })
}

function handleRegister(request, response) {
  const operation = registrationQueue.catch(() => {}).then(() => registerAccount(request, response))
  registrationQueue = operation.catch(() => {})
  return operation
}

async function registerAccount(request, response) {
  const body = await readJson(request)
  if (isHoneypotFilled(body)) return sendJson(response, 400, { success: false, code: 'INVALID_REGISTRATION_DETAILS' })
  const role = body.role
  const displayName = typeof body.displayName === 'string' ? body.displayName.trim() : ''
  const email = normalizeEmail(body.email)
  const password = body.password
  const collegeName = typeof body.collegeName === 'string' ? body.collegeName.trim() : ''
  const department = typeof body.department === 'string' ? body.department.trim() : ''
  const staffType = body.staffType === 'in-charge' ? 'in-charge' : 'staff'

  if (!['principal', 'hod', 'staff', 'student'].includes(role)) {
    return sendJson(response, 400, { success: false, code: 'INVALID_ROLE' })
  }
  if (displayName.length < 2 || displayName.length > 100 || !validEmail(email) || !validatePassword(password)) {
    return sendJson(response, 400, { success: false, code: 'INVALID_REGISTRATION_DETAILS' })
  }
  if (role !== 'principal' && String(body.collegeCode ?? '').length > 50) {
    return sendJson(response, 400, { success: false, code: 'INVALID_REGISTRATION_DETAILS' })
  }
  if (['hod', 'staff'].includes(role) && (department.length < 2 || department.length > 120 || !/^[\p{L}\p{N} .&()/-]+$/u.test(department))) {
    return sendJson(response, 400, { success: false, code: 'INVALID_REGISTRATION_DETAILS' })
  }
  if (role === 'staff' && !['in-charge', 'staff'].includes(body.staffType)) {
    return sendJson(response, 400, { success: false, code: 'INVALID_STAFF_TYPE' })
  }
  if (database.users.some((user) => user.email === email)) {
    return sendJson(response, 409, { success: false, code: 'EMAIL_ALREADY_REGISTERED' })
  }

  let college
  if (role === 'principal') {
    if (collegeName.length < 3 || collegeName.length > 160) {
      return sendJson(response, 400, { success: false, code: 'INVALID_COLLEGE_NAME' })
    }
    college = { id: randomBytes(16).toString('hex'), name: collegeName, code: makeCollegeCode(), createdAt: new Date().toISOString() }
    database.colleges.push(college)
  } else {
    const code = normalizeCode(body.collegeCode)
    college = database.colleges.find((item) => item.code === code)
    if (!college) return sendJson(response, 404, { success: false, code: 'INVALID_COLLEGE_CODE' })
    if (role === 'hod' && database.users.some((user) => user.collegeId === college.id && user.role === 'hod' && user.department === department)) {
      return sendJson(response, 409, { success: false, code: 'HOD_ALREADY_REGISTERED' })
    }
    if (role === 'staff' && staffType === 'in-charge' && database.users.some((user) => user.collegeId === college.id && user.role === 'staff' && user.department === department && user.staffType === 'in-charge')) {
      return sendJson(response, 409, { success: false, code: 'IN_CHARGE_ALREADY_REGISTERED' })
    }
  }

  const user = {
    id: randomBytes(16).toString('hex'),
    collegeId: college.id,
    role,
    displayName,
    email,
    department,
    ...(role === 'staff' ? { staffType } : {}),
    passwordHash: await createPasswordHash(password),
    createdAt: new Date().toISOString(),
  }
  database.users.push(user)

  try {
    await persistDatabase()
  } catch (error) {
    database.users = database.users.filter((item) => item.id !== user.id)
    if (role === 'principal') database.colleges = database.colleges.filter((item) => item.id !== college.id)
    throw error
  }

  const sessionId = randomBytes(32).toString('hex')
  sessions.set(sessionId, { userId: user.id, expiresAt: Date.now() + sessionLifetime })
  sendJson(response, 201, {
    success: true,
    user: safeUser(user),
    ...(role === 'principal' ? { collegeCode: college.code } : {}),
  }, { 'Set-Cookie': sessionCookie(sessionId, sessionLifetime / 1000) })
}

async function handleLogin(request, response) {
  const body = await readJson(request)
  if (isHoneypotFilled(body)) return sendJson(response, 400, { success: false, code: 'INVALID_LOGIN_DETAILS' })
  const role = body.role
  const email = normalizeEmail(body.identifier ?? body.email)
  const password = body.password
  if (!['principal', 'hod', 'staff', 'student'].includes(role) || !email || typeof password !== 'string') {
    return sendJson(response, 400, { success: false, code: 'INVALID_LOGIN_DETAILS' })
  }

  const user = database.users.find((item) => item.email === email && item.role === role)
  if (!user || !(await passwordMatches(password, user.passwordHash))) {
    return sendJson(response, 401, { success: false, code: 'INVALID_CREDENTIALS' })
  }
  return createSession(response, user)
}

async function handleRequest(request, response) {
  const requestUrl = new URL(request.url ?? '/', 'http://localhost')
  const route = `${request.method} ${requestUrl.pathname}`
  const forwardedProtocol = request.headers['x-forwarded-proto']
  if (process.env.NODE_ENV === 'production' && process.env.PUBLIC_SITE_URL?.startsWith('https://') && forwardedProtocol !== 'https') {
    const destination = new URL(request.url ?? '/', process.env.PUBLIC_SITE_URL)
    response.writeHead(308, { Location: destination.href, 'Cache-Control': 'public, max-age=3600' })
    response.end()
    return
  }
  if (process.env.NODE_ENV === 'production' && forwardedProtocol === 'https') {
    response.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }
  if (requestUrl.pathname === '/robots.txt' && ['GET', 'HEAD'].includes(request.method ?? '')) {
    const origin = siteOrigin(request)
    const robots = ['User-agent: *', 'Allow: /', 'Disallow: /api/', 'Disallow: /staff', 'Disallow: /hod', 'Disallow: /student', 'Disallow: /principal', ...(origin ? [`Sitemap: ${origin}/sitemap.xml`] : [])].join('\n') + '\n'
    return sendText(response, 200, 'text/plain; charset=utf-8', request.method === 'HEAD' ? '' : robots)
  }
  if (requestUrl.pathname === '/sitemap.xml' && ['GET', 'HEAD'].includes(request.method ?? '')) {
    const origin = siteOrigin(request)
    if (!origin) return sendText(response, 503, 'text/plain; charset=utf-8', 'Set PUBLIC_SITE_URL to the canonical HTTPS site URL to publish a sitemap.\n')
    const publicPaths = ['/', '/privacy', '/faq']
    const urls = publicPaths.map((path) => `<url><loc>${new URL(path, origin).href}</loc></url>`).join('')
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`
    return sendText(response, 200, 'application/xml; charset=utf-8', request.method === 'HEAD' ? '' : sitemap)
  }
  if (!requestUrl.pathname.startsWith('/api/')) {
    if (request.method !== 'GET' && request.method !== 'HEAD') return sendJson(response, 404, { error: 'Not found' })
    const relativePath = requestUrl.pathname === '/' ? 'index.html' : decodeURIComponent(requestUrl.pathname).replace(/^\/+/, '')
    const requestedPath = resolve(staticRoot, relativePath)
    const safePath = requestedPath.startsWith(`${staticRoot}\\`) || requestedPath === resolve(staticRoot, 'index.html')
    try {
      const filePath = safePath ? requestedPath : resolve(staticRoot, 'index.html')
      const content = await readFile(filePath)
      const contentType = {
        '.html': 'text/html; charset=utf-8',
        '.js': 'text/javascript; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.svg': 'image/svg+xml',
        '.png': 'image/png',
        '.ico': 'image/x-icon',
      }[extname(filePath)] ?? 'application/octet-stream'
      response.writeHead(200, { 'Content-Type': contentType, 'X-Content-Type-Options': 'nosniff' })
      response.end(request.method === 'HEAD' ? undefined : content)
    } catch (error) {
      if (error?.code === 'ENOENT' && extname(relativePath) === '') {
        try {
          const content = await readFile(resolve(staticRoot, 'index.html'))
          const knownRoutes = ['/', '/principal', '/hod', '/staff', '/student', '/privacy', '/faq']
          const statusCode = knownRoutes.includes(requestUrl.pathname) ? 200 : 404
          response.writeHead(statusCode, { 'Content-Type': 'text/html; charset=utf-8', 'X-Content-Type-Options': 'nosniff' })
          response.end(request.method === 'HEAD' ? undefined : content)
          return
        } catch (indexError) {
          if (indexError?.code !== 'ENOENT') throw indexError
          return sendJson(response, 503, { error: 'Build the frontend first with npm run build.' })
        }
      }
      if (error?.code === 'ENOENT') return sendJson(response, 404, { error: 'Not found' })
      throw error
    }
    return
  }

  if (route === 'GET /api/health') return sendJson(response, 200, { ok: true })
  if (route === 'GET /api/auth/session') {
    const user = sessionUser(request)
    return sendJson(response, 200, user
      ? { success: true, user: safeUser(user) }
      : { success: true, user: null })
  }
  if (route === 'POST /api/auth/register') {
    if (applyAuthRateLimit(request, response, '/register')) return
    return handleRegister(request, response)
  }
  if (route === 'POST /api/auth/login') {
    if (applyAuthRateLimit(request, response, '/login')) return
    return handleLogin(request, response)
  }
  if (route === 'POST /api/auth/logout') {
    const sessionId = cookieValue(request, 'portal_session')
    if (sessionId) sessions.delete(sessionId)
    return sendJson(response, 200, { success: true }, { 'Set-Cookie': sessionCookie('', 0) })
  }
  return sendJson(response, 404, { error: 'Not found' })
}

await loadDatabase()

const server = createServer((request, response) => {
  handleRequest(request, response).catch((error) => {
    console.error('Portal API request failed:', error)
    if (!response.headersSent) sendJson(response, error.status ?? 500, { success: false, code: 'SERVER_ERROR' })
    else response.destroy(error)
  })
})

server.listen(port, process.env.API_HOST || '0.0.0.0', () => {
  console.log(`Portal API listening on http://0.0.0.0:${port}`)
})
