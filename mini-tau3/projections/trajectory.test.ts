import { describe, expect, test } from "bun:test"
import type { Event } from "../../../tardigrade/packages/core/src/event.ts"
import { replayProjection } from "../../../tardigrade/packages/core/src/projection/projection.ts"
import { trajectoryProjection } from "./trajectory.ts"

const events: Event[] = [
  { type: "MessageReceived", id: "request", text: "Move $5", at: 1 } as Event,
  { type: "ToolCalled", callId: "call-1", name: "transfer", arguments: { amountCents: 500 }, at: 2 } as Event,
  { type: "ToolReturned", callId: "call-1", result: { id: "transaction_1" }, at: 3 } as Event,
  { type: "TextReturned", text: "Done.", turn: "request", at: 4 } as Event,
  { type: "TurnCompleted", output: "Transferred $5.", turn: "request", at: 5 } as Event,
]

describe("trajectoryProjection", () => {
  test("derives messages and ordered completed tool calls from Tardie events", () => {
    expect(replayProjection(trajectoryProjection, events)).toEqual({
      messages: [
        { messageId: "request", index: 0, role: "user", content: "Move $5", status: "received" },
        { turn: "request", index: 3, role: "assistant", content: "Done.", status: "intermediate" },
        { index: 4, role: "assistant", content: "Transferred $5.", status: "completed" },
      ],
      tools: [{ callId: "call-1", name: "transfer", arguments: { amountCents: 500 }, result: { id: "transaction_1" }, callIndex: 1, returnIndex: 2, status: "returned", unmatchedReturn: false }],
    })
  })

  test("preserves pending, failed, and unmatched calls", () => {
    const result = replayProjection(trajectoryProjection, [
      { type: "ToolCalled", callId: "pending", name: "get_account", arguments: { accountId: "a" }, at: 1 } as Event,
      { type: "ToolCalled", callId: "failed", name: "transfer", arguments: {}, at: 2 } as Event,
      { type: "ToolReturned", callId: "failed", result: { error: "Insufficient funds" }, at: 3 } as Event,
      { type: "ToolReturned", callId: "orphan", result: { ok: true }, at: 4 } as Event,
      { type: "TurnFailed", error: "model stopped", cause: "model", attempts: 1, at: 5 } as Event,
    ])
    expect(result.tools.map(({ callId, callIndex, returnIndex, status, unmatchedReturn }) => ({ callId, callIndex, returnIndex, status, unmatchedReturn }))).toEqual([
      { callId: "pending", callIndex: 0, returnIndex: undefined, status: "pending", unmatchedReturn: false },
      { callId: "failed", callIndex: 1, returnIndex: 2, status: "error", unmatchedReturn: false },
      { callId: "orphan", callIndex: undefined, returnIndex: 3, status: "returned", unmatchedReturn: true },
    ])
    expect(result.messages.at(-1)).toEqual({ index: 4, role: "assistant", content: "model stopped", status: "failed" })
  })

  test("incremental stepping equals full replay", () => {
    const state = events.reduce(trajectoryProjection.step, trajectoryProjection.initial())
    expect(trajectoryProjection.output(state)).toEqual(replayProjection(trajectoryProjection, events))
  })
})
