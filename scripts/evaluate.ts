import { readFile } from 'node:fs/promises'
import { evaluateRun } from '../mini-tau3/evals/evaluate.ts'
import { loadBankingTask, bankingTaskIds, type BankingTaskId } from '../mini-tau3/tasks/index.ts'
import type { CaseRun } from '../mini-tau3/types.ts'

const file = process.argv[2]
if (!file) throw new Error('Usage: bun run eval <case.json or summary.json>')
const value = JSON.parse(await readFile(file, 'utf8'))
const runs: CaseRun[] = Array.isArray(value.cases) ? value.cases : [value]
const results = runs.map(run => {
  try {
    if (!bankingTaskIds.includes(run.id as BankingTaskId)) throw new Error(`Unknown task ${run.id}.`)
    return { id: run.id, ...evaluateRun(loadBankingTask(run.id as BankingTaskId), run) }
  } catch (error) {
    return { id: run.id, error: error instanceof Error ? error.message : String(error) }
  }
})
console.log(JSON.stringify(results.length === 1 ? results[0] : results, null, 2))
