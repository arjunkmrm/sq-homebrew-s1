import { describe, expect, test } from "bun:test"
import fixture from "./fixtures/first-transfer.json" with { type: "json" }
import { scoreEfficientRun } from "./efficient-run.ts"
import type { TransferRun } from "./transfer-run.ts"

const recorded = fixture as TransferRun

function runWithTelemetry(): TransferRun {
  const run = structuredClone(recorded)
  run.events.unshift({ type: "MessageReceived", at: 1_000, id: "request" })
  run.events.splice(-1, 0,
    { type: "ModelReturned", callId: "first", outcome: "returned", usage: { promptTokens: 1_000, completionTokens: 100, costUsd: 0.01 } },
    { type: "ModelReturned", callId: "second", outcome: "returned", usage: { promptTokens: 2_000, completionTokens: 400, totalTokens: 2_400, costUsd: 0.02 } },
  )
  run.events[run.events.length - 1] = { ...run.events.at(-1)!, at: 11_000, turn: "request" }
  return run
}

describe("scoreEfficientRun", () => {
  test("adds time and token penalties to the transfer score", () => {
    const score = scoreEfficientRun(runWithTelemetry())
    expect(score).toMatchObject({
      total: 7.3, // 9 - (10 seconds * .1) - (3,500 tokens / 1,000 * .2)
      completion: 10,
      toolCost: -1,
      timeCost: -1,
      durationMs: 10_000,
      promptTokens: 3_000,
      completionTokens: 500,
      totalTokens: 3_500,
      costUsd: 0.03,
    })
    expect(score.tokenCost).toBeCloseTo(-0.7)
  })

  test("ignores a later judge terminal when measuring the agent turn", () => {
    const run = runWithTelemetry()
    run.events.push({ type: "TurnCompleted", turn: "judge", at: 999_999 })
    expect(scoreEfficientRun(run).durationMs).toBe(10_000)
  })

  test("sums multiple model calls and counts a duplicated call only once", () => {
    const run = runWithTelemetry()
    run.events.push({ type: "ModelReturned", callId: "second", outcome: "returned", usage: { promptTokens: 99_999, completionTokens: 99_999, totalTokens: 199_998, costUsd: 9 } })
    expect(scoreEfficientRun(run)).toMatchObject({ promptTokens: 3_000, completionTokens: 500, totalTokens: 3_500, costUsd: 0.03 })
  })

  test("keeps unknown telemetry unknown, including a failed call without usage", () => {
    const run = runWithTelemetry()
    run.events.push({ type: "ModelReturned", callId: "failed", outcome: "failed" })
    const score = scoreEfficientRun(run)
    expect(score.total).toBeNull()
    expect(score.promptTokens).toBeNull()
    expect(score.totalTokens).toBeNull()
    expect(score.costUsd).toBeNull()
    expect(score.missing).toEqual(expect.arrayContaining(["totalTokens", "costUsd"]))
  })

  test("includes spend from failed calls when usage was recorded", () => {
    const run = runWithTelemetry()
    run.events.push({ type: "ModelReturned", callId: "failed", outcome: "failed", usage: { promptTokens: 100, completionTokens: 0, costUsd: 0.005 } })
    const score = scoreEfficientRun(run)
    expect(score.totalTokens).toBe(3_600)
    expect(score.costUsd).toBeCloseTo(0.035)
  })
})
