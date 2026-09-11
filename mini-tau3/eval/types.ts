import type { BankState } from "../bank/schema.ts"
import type { evaluateState } from "./state-checks.ts"
import type { Event } from "../../../tardigrade/packages/core/src/event.ts"
import type { Trajectory } from "../projections/trajectory.ts"
import type { AgentVersion } from "../agents/variant-info.ts"

export type Query = {
  id: string
  customerId: string
  initialState: string
  request: string
  expectedAnswer: string
}

export type ModelRef = { provider: string; model_id: string }

export type CaseRun = {
  id: string
  agentVersion: AgentVersion
  request: string
  status: "judged" | "error"
  finalAnswer?: string
  judgment?: { pass: boolean; score: number; rationale: string; scope: "response-only" }
  stateChecks: ReturnType<typeof evaluateState>
  error?: { stage: "agent" | "judge"; message: string }
  events: Event[]
  trajectory: Trajectory
  stateBefore: BankState
  stateAfter: BankState
  startedAt: string
  finishedAt: string
}
