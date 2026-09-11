import { scoreBankingRun } from '../../../workshop/mini-tau3/rewards/banking'
import { loadBankingTask, bankingTaskIds, type BankingTaskId } from '../../../workshop/mini-tau3/tasks'
import type { CaseRun } from '../../../workshop/mini-tau3/types'
import type { ViewRun } from './load-run'

// Display the runner's shared outcome result; the CLI evaluator recomputes it from snapshots.
export function scoreRun(run: ViewRun) {
  if (!bankingTaskIds.includes(run.id as BankingTaskId)) throw new Error('Unknown banking task.')
  if (!run.outcome) throw new Error('This log has no shared outcome evaluation. Run the task again with the current runner.')
  return scoreBankingRun(loadBankingTask(run.id as BankingTaskId), run as CaseRun, run.outcome)
}
