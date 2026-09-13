// Records a real model run and saves it as the offline replay fixture the slides ship with.
// The slides are deployed as static files, so nothing on the page can call a model; slide 20
// replays this log instead. Re-record with:
//   bun run scripts/record-example.ts [--case task_093] [--model openrouter:openai/gpt-5.6-terra]
// Pass --from <run directory> to package a run the workshop CLI already produced instead of
// spending another model call.
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { scoreBankingRun } from '../../mini-tau3/rewards/banking'
import { loadBankingTask, type BankingTaskId } from '../../mini-tau3/tasks'

const argument = (name: string, fallback: string) => {
  const index = process.argv.indexOf(`--${name}`)
  return index === -1 ? fallback : (process.argv[index + 1] ?? fallback)
}
const caseId = argument('case', 'task_093') as BankingTaskId
const model = argument('model', '')
const from = argument('from', '')

const MINI_TAU3 = fileURLToPath(new URL('../../mini-tau3/', import.meta.url))
const WORKSHOP_ENV_FILE = fileURLToPath(new URL('../../.env', import.meta.url))
const output = from ? fileURLToPath(new URL(from, `file://${process.cwd()}/`)) : await mkdtemp(join(tmpdir(), 'record-example-'))
try {
  if (!from) {
    const env = { ...process.env, ...(model ? { TAU3_AGENT_MODEL: model } : {}) }
    const args = [...(existsSync(WORKSHOP_ENV_FILE) ? ['--env-file', WORKSHOP_ENV_FILE] : []), 'run', join(MINI_TAU3, 'cli/index.ts'), 'run', '--cases', caseId, '--output', output]
    const code = await new Promise<number>((resolve, reject) => {
      const child = spawn('bun', args, { cwd: MINI_TAU3, env, stdio: ['ignore', 'inherit', 'inherit'] })
      child.once('error', reject)
      child.once('exit', (status, signal) => resolve(signal ? 1 : (status ?? 1)))
    })
    if (code !== 0) throw new Error('The banking runner failed; no fixture was written.')
  }

  const run = JSON.parse(await readFile(join(output, `${caseId}.json`), 'utf8'))
  const summary = JSON.parse(await readFile(join(output, 'summary.json'), 'utf8'))
  const agentModel = `${summary.agentModel.provider}:${summary.agentModel.model_id}`
  // The score is recomputed in the browser; failing here means the log cannot be scored at all.
  const score = scoreBankingRun(loadBankingTask(caseId), run, run.outcome)
  const day = new Date(summary.generatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

  const fixture = {
    ...run,
    agent: `Baseline · ${summary.agentModel.model_id}`,
    recorded: { at: summary.generatedAt, agentModel, customerModel: `${summary.customerModel.provider}:${summary.customerModel.model_id}` },
    provenance: `Real ${caseId} run of the baseline agent against ${agentModel}, recorded ${day}. Every event, timing, token count and cost below comes from that run; the slides replay the saved log and never call a model.`,
  }
  await Bun.write(new URL(`../public/runs/${caseId.replace('_', '-')}-recorded.json`, import.meta.url), JSON.stringify(fixture))
  console.log({ case: caseId, model: agentModel, events: run.events.length, outcome: run.outcome?.pass, total: score.total, toolCalls: score.toolCalls, totalTokens: score.totalTokens })
} finally {
  if (!from) await rm(output, { recursive: true, force: true })
}
