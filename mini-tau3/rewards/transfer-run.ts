import type { Event } from "tardie/core/event"
import type { BankState } from "../environment/bank/schema.ts"
import { evaluateState, type StateCheck } from "../evals/state-checks.ts"
import { trajectoryProjection } from "./trajectory.ts"
export type RewardWeights = { completion: number; call: number }
export const defaultWeights: RewardWeights = { completion: 10, call: -0.5 }

export type TransferRun = {
  id: string
  events: Array<{ type: string; [key: string]: unknown }>
  stateBefore?: unknown
  stateAfter?: unknown
}

export type TransferRunScore = {
  total: number
  completion: number
  toolCost: number
  toolCalls: number
  completed: boolean
  checks: StateCheck[]
}

const taskId = "transfer-between-own-accounts"
const transferAmountCents = 50_000

function record(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined
}

function isBankState(value: unknown): value is BankState {
  const state = record(value)
  if (!state || !Array.isArray(state.customers) || !Array.isArray(state.accounts) || !Array.isArray(state.transactions)) return false
  return state.customers.every((customer) => {
    const item = record(customer)
    return item && typeof item.id === "string" && typeof item.name === "string" && Array.isArray(item.accountIds) && item.accountIds.every((id) => typeof id === "string")
  }) && state.accounts.every((account) => {
    const item = record(account)
    return item && typeof item.id === "string" && typeof item.customerId === "string" &&
      (item.type === "checking" || item.type === "savings") && Number.isInteger(item.balanceCents) &&
      item.currency === "USD" && (item.status === "open" || item.status === "closed")
  }) && state.transactions.every((transaction) => {
    const item = record(transaction)
    return item && typeof item.id === "string" && typeof item.sourceAccountId === "string" &&
      typeof item.destinationAccountId === "string" && Number.isInteger(item.amountCents) &&
      (item.status === "pending" || item.status === "completed")
  })
}

function snapshots(run: TransferRun): { before: BankState; after: BankState } {
  if (!isBankState(run.stateBefore)) throw new Error("Transfer run is missing a valid stateBefore bank snapshot.")
  if (!isBankState(run.stateAfter)) throw new Error("Transfer run is missing a valid stateAfter bank snapshot.")
  return { before: run.stateBefore, after: run.stateAfter }
}

type TransferEvidence = {
  id: string
  sourceAccountId: string
  destinationAccountId: string
  amountCents: number
  status: "pending" | "completed"
}

function transferEvidence(result: unknown, callId: string): TransferEvidence {
  const transaction = record(result)
  const amountCents = transaction?.amountCents
  if (!transaction || typeof transaction.id !== "string" || typeof transaction.sourceAccountId !== "string" ||
    typeof transaction.destinationAccountId !== "string" || typeof amountCents !== "number" || !Number.isInteger(amountCents) ||
    amountCents < 0 || (transaction.status !== "completed" && transaction.status !== "pending")) {
    throw new Error(`Transfer tool return for call ${callId} is malformed; expected a transaction result with integer amountCents and pending or completed status.`)
  }
  return {
    id: transaction.id,
    sourceAccountId: transaction.sourceAccountId,
    destinationAccountId: transaction.destinationAccountId,
    amountCents,
    status: transaction.status,
  }
}

function ledgerCheck(before: BankState, after: BankState, evidence: TransferEvidence[]): StateCheck {
  const savings = before.accounts.find((account) => account.customerId === "customer_alex" && account.type === "savings")
  const checking = before.accounts.find((account) => account.customerId === "customer_alex" && account.type === "checking")
  if (!savings || !checking) throw new Error("Transfer run snapshots must include Alex's savings and checking accounts.")

  const beforeIds = new Set(before.transactions.map((transaction) => transaction.id))
  const transactions = after.transactions.filter((transaction) => !beforeIds.has(transaction.id))
  const validTransactions = transactions.length > 0 && transactions.every((transaction) =>
    transaction.status === "completed" &&
    Number.isInteger(transaction.amountCents) && transaction.amountCents > 0 &&
    ((transaction.sourceAccountId === savings.id && transaction.destinationAccountId === checking.id) ||
      (transaction.sourceAccountId === checking.id && transaction.destinationAccountId === savings.id)),
  )
  const uniqueIds = new Set(transactions.map((transaction) => transaction.id)).size === transactions.length
  const netCents = transactions.reduce((total, transaction) => total +
    (transaction.sourceAccountId === savings.id ? transaction.amountCents : -transaction.amountCents), 0)
  const completedEvidence = evidence.filter((item) => item.status === "completed")
  const sameEvidence = completedEvidence.length === 0 ||
    completedEvidence.length === transactions.length &&
    completedEvidence.every((item) => transactions.some((transaction) =>
      transaction.id === item.id && transaction.sourceAccountId === item.sourceAccountId &&
      transaction.destinationAccountId === item.destinationAccountId && transaction.amountCents === item.amountCents,
    ))
  const pass = validTransactions && uniqueIds && netCents === transferAmountCents && sameEvidence
  return {
    name: "completed transfer ledger results",
    pass,
    detail: "New ledger entries must be unique completed transfers between Alex's savings and checking, net $500 to checking, and agree with returned transfer evidence.",
  }
}

/** Scores an event-sourced $500 savings-to-checking run from state and observed tool activity. */
export function scoreTransferRun(
  run: TransferRun,
  weights: RewardWeights = defaultWeights,
): TransferRunScore {
  if (run.id !== taskId) throw new Error(`Transfer run scorer only supports ${taskId}; received ${run.id}.`)
  if (!Array.isArray(run.events) || !run.events.every((event) => record(event) && typeof event.type === "string")) {
    throw new Error("Transfer run events must be an array of typed event objects.")
  }

  const { before, after } = snapshots(run)
  const trajectoryState = run.events.reduce(
    (state, event) => trajectoryProjection.step(state, event as Event),
    trajectoryProjection.initial(),
  )
  const trajectory = trajectoryProjection.output(trajectoryState)
  const toolCalls = run.events.filter((event) => event.type === "ToolCalled").length
  const evidence = trajectory.tools
    .filter((call) => call.name === "transfer" && call.status === "returned")
    .map((call) => transferEvidence(call.result, call.callId))
  const evaluation = evaluateState(taskId, before, after)
  const agentCompleted = run.events.some((event) => event.type === "TurnCompleted")
  const ledger = ledgerCheck(before, after, evidence)
  const stateChecks = evaluation.checks.map((check) =>
    check.name === "one completed transfer recorded" ? ledger : check,
  )
  const completed = stateChecks.every((check) => check.pass) && agentCompleted
  const checks = [
    ...stateChecks,
    {
      name: "agent run completed",
      pass: agentCompleted,
      detail: agentCompleted
        ? "The agent emitted a TurnCompleted event."
        : "The bank state may be correct, but no TurnCompleted event was recorded for the agent run.",
    },
  ]
  const completion = completed ? weights.completion : 0
  const toolCost = toolCalls * weights.call

  return {
    total: completion + toolCost,
    completion,
    toolCost,
    toolCalls,
    completed,
    checks,
  }
}
