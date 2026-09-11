import type { StateEvaluation } from "./evaluation/outcome.ts"
import type { BankingAuditEntry, BankingDb } from "./environment/banking.ts"
import type { Event } from "tardie/core/event"
import type { Trajectory } from "./trajectory.ts"

export type CustomerConsent = { openAccounts: boolean; transfers: boolean; closeAccounts: boolean; credits: boolean; reports: boolean }
export type CustomerTurn = { text: string; afterToolSeq: number; consent?: CustomerConsent }

export type ModelRef = { provider: string; model_id: string }

export type CaseRun = {
  id: string
  agentVersion: string
  request: string
  status: "judged" | "error"
  finalAnswer?: string
  outcome: StateEvaluation
  error?: { stage: "agent"; message: string }
  events: Event[]
  trajectory: Trajectory
  audit?: BankingAuditEntry[]
  customerTurns?: CustomerTurn[]
  customerEvents?: Event[]
  stateBefore: BankingDb
  stateAfter: BankingDb
  startedAt: string
  finishedAt: string
}
