import { evaluateRun } from "../evals/evaluate.ts"
import { loadBankingTask, bankingTaskIds, type BankingTaskId } from "../tasks/index.ts"
import { loadSavedRuns } from "./saved-runs.ts"

export async function evaluateSavedRun(file: string) {
  const runs = await loadSavedRuns(file)
  const results = runs.map(run => {
    try {
      if (!bankingTaskIds.includes(run.id as BankingTaskId)) throw new Error(`Unknown task ${run.id}.`)
      return { id: run.id, ...evaluateRun(loadBankingTask(run.id as BankingTaskId), run) }
    } catch (error) {
      return { id: run.id, error: error instanceof Error ? error.message : String(error) }
    }
  })
  console.log(JSON.stringify(results.length === 1 ? results[0] : results, null, 2))
}
