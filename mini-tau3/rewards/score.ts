import { scoreInterestRun } from "./interest-run.ts"
import { scoreBankingRun } from "./banking-run.ts"
import { loadBankingTask, bankingTaskIds, type BankingTaskId } from "../tasks/index.ts"
import type { CaseRun } from "../types.ts"

export function scoreSavedRun(run: CaseRun) {
  if (!bankingTaskIds.includes(run.id as BankingTaskId)) throw new Error(`No scorer for ${run.id}.`)
  return run.id === "task_097"
    ? scoreInterestRun(run)
    : scoreBankingRun(loadBankingTask(run.id as BankingTaskId), run)
}
