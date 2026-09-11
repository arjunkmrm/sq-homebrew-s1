import { describe, expect, test } from "bun:test"
import fixture from "./fixtures/first-transfer.json" with { type: "json" }
import { scoreTransferRun, type TransferRun } from "./transfer-run.ts"

const recorded = fixture as TransferRun

function clone(): TransferRun {
  return structuredClone(recorded)
}

describe("scoreTransferRun", () => {
  test("scores the recorded $500 transfer from its actual state and events", () => {
    expect(scoreTransferRun(recorded)).toMatchObject({
      total: 9,
      completion: 10,
      toolCost: -1,
      toolCalls: 2,
      completed: true,
    })
  })

  test("keeps completion for reverse transfers that restore the requested final state", () => {
    const run = clone()
    run.events.splice(-1, 0,
      { type: "ToolCalled", callId: "reverse", name: "transfer" },
      { type: "ToolReturned", callId: "reverse", result: {
        id: "transaction_2", sourceAccountId: "account_alex_checking", destinationAccountId: "account_alex_savings", amountCents: 50_000, status: "completed",
      } },
      { type: "ToolCalled", callId: "forward-again", name: "transfer" },
      { type: "ToolReturned", callId: "forward-again", result: {
        id: "transaction_3", sourceAccountId: "account_alex_savings", destinationAccountId: "account_alex_checking", amountCents: 50_000, status: "completed",
      } },
    )
    const after = run.stateAfter as { transactions: unknown[] }
    after.transactions.push(
      { id: "transaction_2", sourceAccountId: "account_alex_checking", destinationAccountId: "account_alex_savings", amountCents: 50_000, status: "completed" },
      { id: "transaction_3", sourceAccountId: "account_alex_savings", destinationAccountId: "account_alex_checking", amountCents: 50_000, status: "completed" },
    )
    expect(scoreTransferRun(run)).toMatchObject({ completed: true, toolCalls: 4, total: 8 })
  })

  test("charges failed tool attempts", () => {
    const run = clone()
    run.events.splice(-1, 0,
      { type: "ToolCalled", callId: "failed-transfer", name: "transfer" },
      { type: "ToolReturned", callId: "failed-transfer", result: { error: "Insufficient funds" } },
    )
    expect(scoreTransferRun(run)).toMatchObject({ toolCalls: 3, total: 8.5 })
  })

  test("refuses another task, invalid snapshots, and malformed successful transfer evidence", () => {
    const wrongTask = clone()
    wrongTask.id = "close-savings"
    expect(() => scoreTransferRun(wrongTask)).toThrow("only supports")

    const missingSnapshot = clone()
    delete missingSnapshot.stateAfter
    expect(() => scoreTransferRun(missingSnapshot)).toThrow("stateAfter")

    const malformed = clone()
    const transferReturn = malformed.events.find((event) => event.type === "ToolReturned" && event.callId === "transfer")!
    transferReturn.result = { id: "transaction_1", status: "completed" }
    expect(() => scoreTransferRun(malformed)).toThrow("malformed")
  })

  test("explains an absent completed agent event without trusting a recorded judgment", () => {
    const run = clone()
    run.events = run.events.filter((event) => event.type !== "TurnCompleted")
    const score = scoreTransferRun(run)
    expect(score.completed).toBe(false)
    expect(score.checks.find((check) => check.name === "agent run completed")).toMatchObject({ pass: false })
  })
})
