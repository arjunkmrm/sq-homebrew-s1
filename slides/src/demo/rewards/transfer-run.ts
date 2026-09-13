import type { BankingAuditEntry } from "../../../../mini-tau3/environment/banking.ts"
import { evaluateState, type StateCheck } from "../evals/state-checks.ts"
import type { LegacyBankState as BankState } from "./legacy-bank-state.ts"
type CustomerTurnEvidence = { text: string; afterToolSeq: number; consent?: { credits: boolean; reports: boolean } }

export type RewardWeights = { completion: number; call: number }
export const defaultWeights: RewardWeights = { completion: 10, call: -0.5 }

export type TransferRun = {
  id: string
  events: Array<{ type: string; [key: string]: unknown }>
  stateBefore?: unknown
  stateAfter?: unknown
  audit?: unknown[]
  customerTurns?: CustomerTurnEvidence[]
  status?: "judged" | "error"
  error?: unknown
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
const transferTool = "transfer_funds_between_bank_accounts_7291"
const record = (value: unknown): Record<string, unknown> | undefined =>
  typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : undefined

function transferAuditCheck(values: unknown[] | undefined): StateCheck | undefined {
  const audit = values?.filter((value): value is BankingAuditEntry => {
    const entry = record(value)
    return !!entry && typeof entry.seq === "number" && typeof entry.toolName === "string" && !!record(entry.args) && typeof entry.result === "string" && typeof entry.ok === "boolean" && typeof entry.mutated === "boolean"
  })
  if (audit === undefined) return undefined
  const transfers = audit.flatMap(entry => {
    if (!entry.ok || !entry.mutated || entry.toolName !== "call_discoverable_agent_tool" || entry.args.agent_tool_name !== transferTool) return []
    const args = record(entry.args.parsed_arguments)
    if (!args) return []
    return [{ source: String(args.source_account_id ?? ""), destination: String(args.destination_account_id ?? ""), amount: Number(args.amount) }]
  })
  const net = transfers.reduce((total, item) => {
    if (item.source === "account_alex_savings" && item.destination === "account_alex_checking") return total + item.amount
    if (item.source === "account_alex_checking" && item.destination === "account_alex_savings") return total - item.amount
    return Number.NaN
  }, 0)
  return {
    name: "successful transfer audit",
    pass: transfers.length > 0 && Number.isFinite(net) && Math.abs(net - 500) < .00001,
    detail: "Successful canonical transfer mutations must net $500 from Alex's savings to checking.",
  }
}

/** Scores the $500 transfer from final state and observed tool activity. */
export function scoreTransferRun(run: TransferRun, weights: RewardWeights = defaultWeights): TransferRunScore {
  if (run.id !== taskId) throw new Error(`Transfer run scorer only supports ${taskId}; received ${run.id}.`)
  if (!Array.isArray(run.events) || !run.events.every(event => record(event) && typeof event.type === "string")) {
    throw new Error("Transfer run events must be an array of typed event objects.")
  }
  const evaluation = evaluateState(taskId, run.stateBefore as BankState, run.stateAfter as BankState)
  const auditCheck = transferAuditCheck(run.audit)
  const stateChecks = auditCheck ? [...evaluation.checks, auditCheck] : evaluation.checks
  const agentCompleted = run.events.some(event => event.type === "TurnCompleted")
  const runSucceeded = run.status !== "error" && run.error === undefined
  const completed = stateChecks.every(item => item.pass) && agentCompleted && runSucceeded
  const checks = [...stateChecks, {
    name: "agent run completed",
    pass: agentCompleted && runSucceeded,
    detail: agentCompleted && runSucceeded ? "The run completed successfully." : "The run ended without a successful terminal result.",
  }]
  const toolCalls = run.events.filter(event => event.type === "ToolCalled").length
  const completion = completed ? weights.completion : 0
  const toolCost = toolCalls * weights.call
  return { total: completion + toolCost, completion, toolCost, toolCalls, completed, checks }
}
