import type { BankingDb, BankingRecord } from "../environment/banking.ts"

export type StateCheck = { name: string; pass: boolean; detail: string }
export type StateEvaluation = { pass: boolean; checks: StateCheck[]; matchedChanges: number; expectedChanges: number }
export type ReferenceOutcome = { taskId: string; stateBefore: BankingDb; stateExpected: BankingDb }
export type OutcomeRun = { id: string; stateBefore: unknown; stateAfter: unknown }

const record = (value: unknown): Record<string, unknown> | undefined =>
  typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : undefined
const stable = (value: unknown): unknown => Array.isArray(value) ? value.map(stable) : record(value)
  ? Object.fromEntries(Object.entries(value as Record<string, unknown>).sort(([left], [right]) => left.localeCompare(right)).map(([key, item]) => [key, stable(item)]))
  : value
export const sameStateValue = (left: unknown, right: unknown): boolean => JSON.stringify(stable(left)) === JSON.stringify(stable(right))

export function requireBankingDb(value: unknown, label: string): asserts value is BankingDb {
  const db = record(value)
  if (!db || !Object.values(db).every(value => {
    const table = record(value)
    return !!table && !!record(table.data) && typeof table.notes === "string"
  })) throw new Error(`${label} is not a canonical banking snapshot.`)
}

type Change = { table: string; id: string; expected: BankingRecord | undefined }
function referenceChanges(before: BankingDb, expected: BankingDb, ignoredTables: Set<string>): Change[] {
  const tables = new Set([...Object.keys(before), ...Object.keys(expected)])
  return [...tables].filter(name => !ignoredTables.has(name)).flatMap(name => {
    const initialRows = before[name]?.data ?? {}, expectedRows = expected[name]?.data ?? {}
    const ids = new Set([...Object.keys(initialRows), ...Object.keys(expectedRows)])
    return [...ids].filter(id => !sameStateValue(initialRows[id], expectedRows[id])).map(id => ({ table: name, id, expected: expectedRows[id] }))
  })
}

/** evaluateOutcome compares canonical DB effects and ignores only non-outcome bookkeeping tables. */
export function evaluateOutcome(reference: ReferenceOutcome, run: OutcomeRun): StateEvaluation {
  if (run.id !== reference.taskId) throw new Error("Run and reference task IDs must match.")
  requireBankingDb(run.stateBefore, "stateBefore")
  requireBankingDb(run.stateAfter, "stateAfter")
  const stateBefore = run.stateBefore as BankingDb, stateAfter = run.stateAfter as BankingDb
  if (!sameStateValue(stateBefore, reference.stateBefore)) throw new Error("Run initial state does not match the selected banking task.")
  const ignored = new Set(["verification_history", "agent_discoverable_tools"])
  const changes = referenceChanges(reference.stateBefore, reference.stateExpected, ignored)
  if (changes.length === 0) throw new Error("Reference state contains no expected database changes.")
  const matched = changes.filter(change => sameStateValue(stateAfter[change.table]?.data?.[change.id], change.expected)).length
  const tables = new Set([...Object.keys(reference.stateExpected), ...Object.keys(stateAfter)])
  const exact = [...tables].filter(name => !ignored.has(name)).every(name => sameStateValue(stateAfter[name], reference.stateExpected[name]))
  return {
    pass: exact,
    checks: [{ name: "Reference database outcome", pass: exact, detail: `${matched} of ${changes.length} expected record changes match; no extra task-state changes are allowed.` }],
    matchedChanges: matched,
    expectedChanges: changes.length,
  }
}
