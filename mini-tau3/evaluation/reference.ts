import { createBankingEnvironment } from "../environment/banking.ts"
import { createBankingTaskSeed, executeGoldAssistantAction, type BankingTask } from "../tasks/index.ts"
import type { ReferenceOutcome } from "./outcome.ts"

/** buildReferenceOutcome executes hidden gold actions in a fresh canonical environment. */
export function buildReferenceOutcome(task: BankingTask): ReferenceOutcome {
  const environment = createBankingEnvironment(createBankingTaskSeed(task))
  const stateBefore = environment.snapshot()
  for (const action of task.evaluation_criteria.actions) {
    const result = executeGoldAssistantAction(environment, action)
    if (typeof result === "string" && (result.startsWith("Error:") || result.startsWith("Failed"))) {
      throw new Error(`Gold action ${action.action_id} failed: ${result}`)
    }
  }
  return { taskId: task.id, stateBefore, stateExpected: environment.snapshot() }
}
