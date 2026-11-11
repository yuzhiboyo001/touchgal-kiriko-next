import { readdir, stat } from 'fs/promises'
import path from 'path'

const standaloneRoot = path.resolve('.next/standalone')
const forbidden = new Set([
  '.env',
  '.env.local',
  '.env.production',
  '.env.production.local',
  'backup',
  'PythonProject17',
  '.tmp'
])

const entries = await readdir(standaloneRoot, { withFileTypes: true })
const names = entries.map((entry) => entry.name)
const problems = []

for (const name of names) {
  if (forbidden.has(name) || name.endsWith('.log')) {
    problems.push(name)
  }
}

for (const required of ['server.js', 'posts', 'config/redirect.json']) {
  try {
    await stat(path.join(standaloneRoot, required))
  } catch {
    problems.push(`missing ${required}`)
  }
}

if (problems.length > 0) {
  console.error('[standalone check] forbidden or missing entries:')
  for (const problem of problems) {
    console.error(`  - ${problem}`)
  }
  process.exit(1)
}

console.log('[standalone check] clean')
console.log(`[standalone check] top-level entries: ${names.sort().join(', ')}`)
