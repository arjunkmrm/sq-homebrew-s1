import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const root = fileURLToPath(new URL('../', import.meta.url))
const runtime = resolve(root, '../tardigrade')
const revision = '4fca5f74e7b5e4bad08b0cd9961617a9ef047fc2'
function run(command: string, args: string[], cwd = root) {
  const result = spawnSync(command, args, { cwd, stdio: 'inherit' })
  if (result.error) throw result.error
  if (result.status !== 0) process.exit(result.status ?? 1)
}

if (!existsSync(runtime)) {
  run('git', ['clone', '--no-checkout', 'https://github.com/clavia-labs/tardigrade.git', runtime])
  run('git', ['checkout', '--detach', revision], runtime)
} else {
  const current = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: runtime, encoding: 'utf8' })
  if (current.status !== 0 || current.stdout.trim() !== revision) {
    throw new Error(`The sibling tardigrade directory must be at ${revision}. Setup leaves existing checkouts untouched; use a fresh parent directory for this workshop.`)
  }
}
run('bun', ['install', '--frozen-lockfile'], runtime)
run('bun', ['install', '--frozen-lockfile'], resolve(root, 'slides'))
console.log('Ready. Run bun run dev from the workshop directory.')
