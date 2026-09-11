export type TransferTask = { amountCents: number; expectedSavingsCents: number; expectedCheckingCents: number };
export type TransferAction =
  | { tool: "list_accounts" }
  | { tool: "transfer"; amountCents: number; reverse?: boolean };
export type TransferState = { savings: number; checking: number; finished: boolean };
export type RewardWeights = { completion: number; call: number; excess: number };

export const defaultWeights: RewardWeights = { completion: 10, call: -0.5, excess: -1 };

// A deliberately small, illustrative trace scorer for the $500 transfer workshop task.
export function reward(
  task: TransferTask, trajectory: TransferAction[],
  finalState: TransferState,
  weights: RewardWeights = defaultWeights,
): number {
  const completed = finalState.finished
    && finalState.savings === task.expectedSavingsCents
    && finalState.checking === task.expectedCheckingCents;
  const moved = trajectory
    .filter(action => action.tool === "transfer")
    .reduce((total, action) => total + Math.abs(action.amountCents), 0);
  const excessUnits = Math.max(0, moved - task.amountCents) / 50_000;
  return Number(completed) * weights.completion
    + trajectory.length * weights.call
    + excessUnits * weights.excess;
}
