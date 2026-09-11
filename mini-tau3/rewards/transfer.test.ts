import assert from "node:assert/strict";
import test from "node:test";
import { reward, type TransferAction, type TransferState } from "./transfer";

const task = { amountCents: 50_000, expectedSavingsCents: 300_000, expectedCheckingCents: 175_000 };
const completed: TransferState = { savings: 300_000, checking: 175_000, finished: true };
const direct: TransferAction[] = [
  { tool: "list_accounts" }, { tool: "list_accounts" }, { tool: "transfer", amountCents: 50_000 },
];

test("scores a direct three-call transfer at 8.5", () => {
  assert.equal(reward(task, direct, completed), 8.5);
});

test("penalizes extra reverse transfers", () => {
  const trace: TransferAction[] = [
    { tool: "list_accounts" },
    { tool: "transfer", amountCents: 50_000 },
    { tool: "transfer", amountCents: 50_000, reverse: true },
    { tool: "transfer", amountCents: 50_000 },
  ];
  assert.equal(reward(task, trace, completed), 6);
});

test("scores a six-call trace with no excess transfer at 7", () => {
  assert.equal(reward(task, Array(6).fill({ tool: "list_accounts" }), completed), 7);
});

test("withholds completion credit from partial final state", () => {
  assert.equal(reward(task, direct, { ...completed, finished: false }), -1.5);
});

test("failed runs still pay for tool calls", () => {
  assert.equal(reward(task, direct, { savings: 350_000, checking: 125_000, finished: false }), -1.5);
});

test("zero penalties create a tie", () => {
  assert.equal(reward(task, direct, completed, { completion: 0, call: 0, excess: 0 }), 0);
});
