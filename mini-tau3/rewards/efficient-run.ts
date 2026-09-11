import { scoreTransferRun, type TransferRun } from "./transfer-run.ts"
import type { StateCheck } from "../eval/state-checks.ts"

export type EfficiencyWeights = {
  completion: number
  call: number
  second: number
  thousandTokens: number
}

export const defaultEfficiencyWeights: EfficiencyWeights = {
  completion: 10,
  call: -0.5,
  second: -0.1,
  thousandTokens: -0.2,
}

export type EfficientRunScore = {
  total: number | null
  completion: number
  toolCost: number
  timeCost: number | null
  tokenCost: number | null
  completed: boolean
  toolCalls: number
  durationMs: number | null
  promptTokens: number | null
  completionTokens: number | null
  totalTokens: number | null
  costUsd: number | null
  missing: string[]
  checks: StateCheck[]
}

type NumericUsage = {
  promptTokens: number | null
  completionTokens: number | null
  totalTokens: number | null
  costUsd: number | null
}

function record(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined
}

function count(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null
}

function modelUsage(event: Record<string, unknown>): NumericUsage {
  const usage = record(event.usage)
  if (!usage) return { promptTokens: null, completionTokens: null, totalTokens: null, costUsd: null }
  const promptTokens = count(usage.promptTokens)
  const completionTokens = count(usage.completionTokens)
  const recordedTotal = count(usage.totalTokens)
  return {
    promptTokens,
    completionTokens,
    totalTokens: recordedTotal ?? (promptTokens === null || completionTokens === null ? null : promptTokens + completionTokens),
    costUsd: count(usage.costUsd),
  }
}

function sum(values: Array<number | null>): number | null {
  return values.length > 0 && values.every((value): value is number => value !== null)
    ? values.reduce((total, value) => total + value, 0)
    : null
}

/** Arithmetic kept separate so the workshop slide can show the reward terms directly. */
export function efficiencyReward(
  completed: boolean,
  toolCalls: number,
  durationMs: number,
  totalTokens: number,
  weights: EfficiencyWeights = defaultEfficiencyWeights,
): number {
  const completion = completed ? weights.completion : 0
  const toolCost = toolCalls * weights.call
  const timeCost = durationMs / 1000 * weights.second
  const tokenCost = totalTokens / 1000 * weights.thousandTokens
  return completion + toolCost + timeCost + tokenCost
}

function durationOf(events: TransferRun["events"]): number | null {
  const start = events.find((event) => event.type === "MessageReceived")
  if (!start) return null
  const startedAt = count(start.at)
  if (startedAt === null) return null
  const turn = typeof start.id === "string" ? start.id : undefined
  const terminal = events.find((event) =>
    (event.type === "TurnCompleted" || event.type === "TurnFailed") &&
    (turn === undefined || event.turn === undefined || event.turn === turn),
  )
  const finishedAt = terminal && count(terminal.at)
  return finishedAt === null || finishedAt === undefined || finishedAt < startedAt ? null : finishedAt - startedAt
}

/**
 * Scores a completed transfer plus its tool, elapsed-time, and token costs.
 * Missing telemetry stays unknown instead of being silently scored as zero.
 */
export function scoreEfficientRun(
  run: TransferRun,
  weights: EfficiencyWeights = defaultEfficiencyWeights,
): EfficientRunScore {
  const transfer = scoreTransferRun(run, weights)
  const durationMs = durationOf(run.events)
  const { promptTokens, completionTokens, totalTokens, costUsd } = measureRunPerformance(run.events)
  const timeCost = durationMs === null ? null : durationMs / 1000 * weights.second
  const tokenCost = totalTokens === null ? null : totalTokens / 1000 * weights.thousandTokens
  const missing = [
    ...(durationMs === null ? ["durationMs"] : []),
    ...(promptTokens === null ? ["promptTokens"] : []),
    ...(completionTokens === null ? ["completionTokens"] : []),
    ...(totalTokens === null ? ["totalTokens"] : []),
    ...(costUsd === null ? ["costUsd"] : []),
  ]

  return {
    total: durationMs === null || totalTokens === null
      ? null
      : efficiencyReward(transfer.completed, transfer.toolCalls, durationMs, totalTokens, weights),
    completion: transfer.completed ? weights.completion : 0,
    toolCost: transfer.toolCalls * weights.call,
    timeCost,
    tokenCost,
    completed: transfer.completed,
    toolCalls: transfer.toolCalls,
    durationMs,
    promptTokens,
    completionTokens,
    totalTokens,
    costUsd,
    missing,
    checks: transfer.checks,
  }
}

/** Shared telemetry for single- and multi-turn workshop tasks. */
export function measureRunPerformance(events: TransferRun["events"]) {
  const responses = new Map<string, Record<string, unknown>>()
  for (const event of events) {
    if (event.type !== "ModelReturned") continue
    const callId = typeof event.callId === "string" ? event.callId : undefined
    if (callId && !responses.has(callId)) responses.set(callId, event)
  }
  const usages = [...responses.values()].map(modelUsage)
  const promptTokens = sum(usages.map((usage) => usage.promptTokens))
  const completionTokens = sum(usages.map((usage) => usage.completionTokens))
  const totalTokens = sum(usages.map((usage) => usage.totalTokens))
  const costUsd = sum(usages.map((usage) => usage.costUsd))
  const first = events.find(event => event.type === "MessageReceived")
  const last = [...events].reverse().find(event => event.type === "TurnCompleted" || event.type === "TurnFailed")
  const start = first && count(first.at)
  const end = last && count(last.at)
  const durationMs = start != null && end != null && end >= start ? end - start : null
  return { durationMs, promptTokens, completionTokens, totalTokens, costUsd }
}
