import { spawn } from 'node:child_process'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
const processes = [
  spawn(process.execPath, [resolve(root, 'server.mjs')], { cwd: root, stdio: 'inherit', env: { ...process.env, PORTAL_DEMO_LOGIN: 'true' } }),
  spawn(process.execPath, [resolve(root, 'node_modules/vite/bin/vite.js'), '--host', '0.0.0.0'], { cwd: root, stdio: 'inherit' }),
]

let shuttingDown = false
function shutdown(code = 0) {
  if (shuttingDown) return
  shuttingDown = true
  for (const child of processes) if (child.exitCode === null) child.kill()
  process.exitCode = code
}

for (const child of processes) {
  child.on('error', (error) => {
    console.error('Unable to start a development service:', error)
    shutdown(1)
  })
  child.on('exit', (code) => {
    if (!shuttingDown) shutdown(code ?? 1)
  })
}

process.on('SIGINT', () => shutdown())
process.on('SIGTERM', () => shutdown())
