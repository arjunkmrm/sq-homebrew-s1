import { readFile } from 'node:fs/promises'
import { scoreEfficientRun } from '../mini-tau3/rewards/efficient-run.ts'
import { scoreInterestRun } from '../mini-tau3/rewards/interest-run.ts'
import type { TransferRun } from '../mini-tau3/rewards/transfer-run.ts'

const file = process.argv[2]
if (!file) throw new Error('Usage: bun run score <case.json or summary.json>')
const value = JSON.parse(await readFile(file, 'utf8'))
const runs: TransferRun[] = Array.isArray(value.cases) ? value.cases : [value]
const results = runs.map(run => {
  if (run.id === 'task_097') return { id: run.id, ...scoreInterestRun(run) }
  if (run.id === 'transfer-between-own-accounts') return { id: run.id, ...scoreEfficientRun(run) }
  return { id: run.id, error: 'No reward function defined for this task yet.' }
})
console.log(JSON.stringify(results.length === 1 ? results[0] : results, null, 2))
