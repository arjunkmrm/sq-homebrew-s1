import { reward as evaluateReward, defaultWeights, type TransferAction, type RewardWeights } from '../../mini-tau3/rewards/transfer'

export type BankAction = TransferAction
export type BankWeights = RewardWeights
export const bankWeights = defaultWeights
export const transferTask = { amountCents: 50000, expectedSavingsCents: 300000, expectedCheckingCents: 175000 }
export const bankRoutes: { name: string; actions: BankAction[] }[] = [
  { name: 'Direct', actions: [{ tool: 'list_accounts' }, { tool: 'transfer', amountCents: 50000 }, { tool: 'list_accounts' }] },
  { name: 'Move, then reverse', actions: [{ tool: 'list_accounts' }, { tool: 'transfer', amountCents: 100000 }, { tool: 'transfer', amountCents: 50000, reverse: true }, { tool: 'list_accounts' }] },
  { name: 'Repeated lookups', actions: [{ tool: 'list_accounts' }, { tool: 'list_accounts' }, { tool: 'list_accounts' }, { tool: 'list_accounts' }, { tool: 'transfer', amountCents: 50000 }, { tool: 'list_accounts' }] },
]
export function scoreBankRoute(actions: BankAction[], weights: BankWeights) {
  let savings = 350000, checking = 125000, moved = 0, total = 0
  return actions.map((action, index) => {
    if (action.tool === 'transfer') {
      const delta = action.amountCents * (action.reverse ? -1 : 1)
      savings -= delta
      checking += delta
      moved += action.amountCents
    }
    const complete = index === actions.length - 1 && savings === 300000 && checking === 175000
    const nextTotal = evaluateReward(transferTask, actions.slice(0, index + 1), { savings, checking, finished: index === actions.length - 1 }, weights)
    const reward = nextTotal - total
    total = nextTotal
    return { action, savings, checking, moved, reward, total, complete }
  })
}
