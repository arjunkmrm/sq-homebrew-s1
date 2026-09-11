import type { BankingTask } from "../tasks/index.ts"
import type { CaseRun } from "../types.ts"
import { evaluateOutcome, type ReferenceOutcome } from "../evaluation/outcome.ts"
import { buildReferenceOutcome } from "../evaluation/reference.ts"

/** evaluateRun is the conventional evaluator entry point for one saved banking run. */
export function evaluateRun(
  task: BankingTask,
  run: Pick<CaseRun, "id" | "stateBefore" | "stateAfter">,
  reference: ReferenceOutcome = buildReferenceOutcome(task),
) {
  if (task.id !== run.id) throw new Error("Task and run IDs must match.")
  return evaluateOutcome(reference, run)
}
