import type { BankingDb, BankingRecord } from "../environment/banking.ts"

export type StateCheck = { name: string; pass: boolean; detail: string }
export type StateEvaluation = { pass: boolean; checks: StateCheck[]; matchedChanges: number; expectedChanges: number }

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
export function referenceChanges(before: BankingDb, expected: BankingDb, ignoredTables = new Set<string>()): Change[] {
  const tables = new Set([...Object.keys(before), ...Object.keys(expected)])
  return [...tables].filter(name => !ignoredTables.has(name)).flatMap(name => {
    const initialRows = before[name]?.data ?? {}, expectedRows = expected[name]?.data ?? {}
    const ids = new Set([...Object.keys(initialRows), ...Object.keys(expectedRows)])
    return [...ids].filter(id => !sameStateValue(initialRows[id], expectedRows[id])).map(id => ({ table: name, id, expected: expectedRows[id] }))
  })
}

/** evaluateState compares canonical final DB effects while ignoring only explicitly incidental tables. */
export function evaluateState(before: unknown, after: unknown, expected: unknown, options: { ignoredTables?: Iterable<string> } = {}): StateEvaluation {
  requireBankingDb(before, "stateBefore")
  requireBankingDb(after, "stateAfter")
  requireBankingDb(expected, "reference state")
  const ignored = new Set(options.ignoredTables ?? [])
  const changes = referenceChanges(before, expected, ignored)
  if (changes.length === 0) throw new Error("Reference state contains no expected database changes.")
  const matched = changes.filter(change => sameStateValue(after[change.table]?.data?.[change.id], change.expected)).length
  const tables = new Set([...Object.keys(expected), ...Object.keys(after)])
  const exact = [...tables].filter(name => !ignored.has(name)).every(name => sameStateValue(after[name], expected[name]))
  const checks: StateCheck[] = [{
    name: "Reference database outcome",
    pass: exact,
    detail: `${matched} of ${changes.length} expected record changes match; no extra task-state changes are allowed.`,
  }]
  return { pass: exact, checks, matchedChanges: matched, expectedChanges: changes.length }
}
