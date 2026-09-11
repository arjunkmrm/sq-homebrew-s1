import { readFile } from 'node:fs/promises'
import { scoreSavedRun } from '../mini-tau3/rewards/score.ts'
import type { CaseRun } from '../mini-tau3/types.ts'

const file = process.argv[2]
if (!file) throw new Error('Usage: bun run score <case.json or summary.json>')
const value = JSON.parse(await readFile(file, 'utf8'))
const runs: CaseRun[] = Array.isArray(value.cases) ? value.cases : [value]
const results = runs.map(run => {
  try { return { id: run.id, ...scoreSavedRun(run) } }
  catch (error) { return { id: run.id, error: error instanceof Error ? error.message : String(error) } }
})
console.log(JSON.stringify(results.length === 1 ? results[0] : results, null, 2))
