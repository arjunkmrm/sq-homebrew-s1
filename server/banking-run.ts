import { spawn, type ChildProcess } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseEnv } from 'node:util'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'

const ENDPOINT = '/api/banking-run'
const MODELS_ENDPOINT = '/api/banking-models'
const DEFAULT_CASE = 'task_093'
const ALLOWED_CASES = new Set(['task_056', 'task_060', 'task_062', 'task_072', 'task_074', 'task_093', 'task_094', 'task_095', 'task_096', 'task_097'])
const TOTAL_TIMEOUT_MS = 260_000
const STREAM_PREFIX = '__TAU3_STREAM__'
const MINI_TAU3 = fileURLToPath(new URL('../../workshop/mini-tau3/', import.meta.url))
const RUNNER = join(MINI_TAU3, 'cli/index.ts')
const WORKSHOP_ENV_FILE = fileURLToPath(new URL('../../workshop/.env', import.meta.url))

const MODEL_OPTIONS = [
  { id: '', label: 'Configured default' },
  { id: 'openrouter:openai/gpt-5.6-terra', label: 'GPT-5.6 Terra' },
  { id: 'openrouter:anthropic/claude-haiku-4.5', label: 'Claude Haiku 4.5' },
  { id: 'openrouter:anthropic/claude-sonnet-4.6', label: 'Claude Sonnet 4.6' },
] as const
const ALLOWED_MODELS = new Set<string>(MODEL_OPTIONS.map(option => option.id))

// Load the same workshop .env used by the CLI, then apply the selected model.
const ENV_WRAPPER = String.raw`
import { spawn } from "node:child_process";

if (process.env.BANKING_MODEL)
  process.env.TAU3_AGENT_MODEL = process.env.BANKING_MODEL;

const child = spawn(process.execPath, ["run", process.env.BANKING_RUNNER, "run", "--cases", process.env.BANKING_CASE, "--output", process.env.BANKING_OUTPUT], {
  cwd: process.env.BANKING_CWD,
  env: process.env,
  stdio: ["ignore", "inherit", "ignore"],
});
for (const signal of ["SIGTERM", "SIGINT"])
  process.on(signal, () => child.kill(signal));
child.once("error", () => process.exit(1));
child.once("exit", (code, signal) => process.exit(signal ? 1 : (code ?? 1)));
`

const json = (response: ServerResponse, status: number, value: unknown) => {
  response.statusCode = status
  response.setHeader('Content-Type', 'application/json; charset=utf-8')
  response.setHeader('Cache-Control', 'no-store')
  response.end(JSON.stringify(value))
}

const loopback = (hostname: string) =>
  hostname === 'localhost' || hostname === '::1' || hostname.startsWith('127.')

function trustedLocalRequest(request: IncomingMessage): boolean {
  const host = request.headers.host
  if (!host) return false
  let requested: URL
  try {
    requested = new URL(`http://${host}`)
  } catch {
    return false
  }
  if (!loopback(requested.hostname)) return false

  const origin = request.headers.origin
  if (!origin) return true
  try {
    const source = new URL(origin)
    return (source.protocol === 'http:' || source.protocol === 'https:') && source.host === requested.host && loopback(source.hostname)
  } catch {
    return false
  }
}

const waitForExit = (child: ChildProcess) => new Promise<number>((resolve, reject) => {
  child.once('error', reject)
  child.once('exit', (code, signal) => resolve(signal ? 1 : (code ?? 1)))
})

const killRun = (child: ChildProcess, signal: 'SIGTERM' | 'SIGKILL') => {
  if (child.pid === undefined) return
  try {
    if (process.platform === 'win32') child.kill(signal)
    else process.kill(-child.pid, signal)
  } catch {
    // The process may have exited between the status check and the signal.
  }
}

type StreamPacket =
  | { kind: 'status'; message: string }
  | { kind: 'event'; event: unknown }

async function executeRun(caseId: string, model: string, onPacket?: (packet: StreamPacket) => void, signal?: AbortSignal): Promise<unknown> {
  const fileEnv = existsSync(WORKSHOP_ENV_FILE) ? parseEnv(await readFile(WORKSHOP_ENV_FILE, 'utf8')) : {}
  const config = { ...fileEnv, ...process.env }
  const agentModel = model || config.TAU3_AGENT_MODEL || ''
  const customerModel = config.TAU3_CUSTOMER_MODEL || agentModel
  if ([agentModel, customerModel].some(value => value.startsWith('openrouter:')) && !config.OPENROUTER_API_KEY?.trim()) {
    throw new Error('Set OPENROUTER_API_KEY in workshop/.env to run the agent and customer.')
  }
  const output = await mkdtemp(join(tmpdir(), 'flamecast-banking-run-'))
  let child: ChildProcess | undefined
  let exited: Promise<number> | undefined
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    const envFile = existsSync(WORKSHOP_ENV_FILE) ? WORKSHOP_ENV_FILE : undefined
    const childEnv: NodeJS.ProcessEnv = {
      ...process.env,
      BANKING_CWD: MINI_TAU3,
      BANKING_RUNNER: RUNNER,
      BANKING_OUTPUT: output,
      BANKING_CASE: caseId,
    }
    if (onPacket) childEnv.TAU3_STREAM_EVENTS = '1'
    else delete childEnv.TAU3_STREAM_EVENTS
    if (model) childEnv.BANKING_MODEL = model
    else delete childEnv.BANKING_MODEL
    child = spawn('bun', [...(envFile ? ['--env-file', envFile] : []), '-e', ENV_WRAPPER], {
      cwd: MINI_TAU3,
      env: childEnv,
      stdio: ['ignore', 'pipe', 'ignore'],
      detached: process.platform !== 'win32',
    })
    let stdout = ''
    child.stdout?.setEncoding('utf8')
    child.stdout?.on('data', (chunk: string) => {
      stdout += chunk
      const lines = stdout.split('\n')
      stdout = lines.pop() ?? ''
      if (!onPacket) return
      for (const line of lines) {
        if (!line.startsWith(STREAM_PREFIX)) continue
        try {
          const packet = JSON.parse(line.slice(STREAM_PREFIX.length)) as StreamPacket
          if (packet.kind === 'status' || packet.kind === 'event') onPacket(packet)
        } catch {
          // Ignore malformed or unrelated runner output.
        }
      }
    })
    exited = waitForExit(child)
    const aborted = new Promise<never>((_, reject) => {
      if (!signal) return
      const abort = () => {
        if (child) killRun(child, 'SIGTERM')
        reject(new Error('The banking run was cancelled.'))
      }
      if (signal.aborted) abort()
      else signal.addEventListener('abort', abort, { once: true })
    })
    const timedOut = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        if (child) killRun(child, 'SIGTERM')
        reject(new Error('The banking run timed out.'))
      }, TOTAL_TIMEOUT_MS)
    })
    const exitCode = await Promise.race([exited, timedOut, aborted])
    const caseFile = join(output, `${caseId}.json`)
    try {
      return JSON.parse(await readFile(caseFile, 'utf8'))
    } catch {
      if (exitCode !== 0) throw new Error('The banking runner failed to complete.')
      throw new Error('The banking runner did not produce a result.')
    }
  } finally {
    if (timer) clearTimeout(timer)
    if (child && child.exitCode === null && child.signalCode === null) {
      killRun(child, 'SIGKILL')
      if (exited) await Promise.race([exited.catch(() => 1), new Promise(resolve => setTimeout(resolve, 1_000))])
    }
    await rm(output, { recursive: true, force: true })
  }
}

export function bankingRunPlugin(): Plugin {
  let active = 0
  return {
    name: 'banking-run',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        let url: URL
        try {
          url = new URL(request.url ?? '/', 'http://localhost')
        } catch {
          return next()
        }
        if (url.pathname === MODELS_ENDPOINT) {
          if (request.method !== 'GET') {
            response.setHeader('Allow', 'GET')
            return json(response, 405, { error: 'Method not allowed.' })
          }
          if (!trustedLocalRequest(request)) return json(response, 403, { error: 'Local request origin required.' })
          return json(response, 200, { models: MODEL_OPTIONS, defaultModel: '' })
        }
        if (url.pathname !== ENDPOINT) return next()
        if (request.method !== 'POST') {
          response.setHeader('Allow', 'POST')
          return json(response, 405, { error: 'Method not allowed.' })
        }
        if (!trustedLocalRequest(request)) return json(response, 403, { error: 'Local request origin required.' })
        const requestedVersion = url.searchParams.get('version') ?? 'baseline'
        if (requestedVersion !== 'baseline') return json(response, 400, { error: 'Only the baseline agent is available.' })
        const requestedCase = url.searchParams.get('case') ?? DEFAULT_CASE
        if (!ALLOWED_CASES.has(requestedCase)) return json(response, 400, { error: 'Unknown banking case.' })
        const requestedModel = url.searchParams.get('model') ?? ''
        if (!ALLOWED_MODELS.has(requestedModel)) return json(response, 400, { error: 'Unknown banking model.' })
        if (active >= 3) return json(response, 409, { error: 'Three banking runs are already in progress.' })

        active += 1
        const streaming = request.headers.accept?.split(',').some(value => value.trim().split(';', 1)[0] === 'application/x-ndjson') ?? false
        const controller = new AbortController()
        response.once('close', () => {
          if (!response.writableEnded) controller.abort()
        })
        try {
          if (!streaming) return json(response, 200, await executeRun(requestedCase, requestedModel, undefined, controller.signal))
          response.statusCode = 200
          response.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8')
          response.setHeader('Cache-Control', 'no-store')
          response.setHeader('X-Content-Type-Options', 'nosniff')
          response.flushHeaders()
          const send = (packet: unknown) => {
            if (!response.destroyed && !response.writableEnded) response.write(`${JSON.stringify(packet)}\n`)
          }
          send({ kind: 'status', message: 'Starting banking run…' })
          const run = await executeRun(requestedCase, requestedModel, send, controller.signal)
          send({ kind: 'result', run })
          response.end()
        } catch (error) {
          const message = error instanceof Error && (error.message === 'The banking run timed out.' || error.message === 'Set OPENROUTER_API_KEY in workshop/.env to run the agent and customer.')
            ? error.message
            : 'The banking run could not be completed.'
          if (streaming && response.headersSent) {
            if (!response.destroyed && !response.writableEnded) response.end(`${JSON.stringify({ kind: 'error', error: message })}\n`)
          } else if (!response.destroyed) json(response, 500, { error: message })
        } finally {
          active -= 1
        }
      })
    },
  }
}
