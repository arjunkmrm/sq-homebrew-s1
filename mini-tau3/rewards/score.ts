import { scoreBankingRun } from "./banking.ts"
import { loadBankingTask, bankingTaskIds, type BankingTaskId } from "../tasks/index.ts"
import type { CaseRun } from "../types.ts"
import { evaluateRun } from "../evals/evaluate.ts"
import type { StateEvaluation } from "../evaluation/outcome.ts"

export function scoreSavedRun(run: CaseRun, outcome?: StateEvaluation) {
  if (!bankingTaskIds.includes(run.id as BankingTaskId)) throw new Error(`No scorer for ${run.id}.`)
  const task = loadBankingTask(run.id as BankingTaskId)
  return scoreBankingRun(task, run, outcome ?? evaluateRun(task, run))
}
