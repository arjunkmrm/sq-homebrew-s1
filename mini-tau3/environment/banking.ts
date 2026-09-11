import { createBankingTools } from "./tools.ts"
import type { BankingAuditEntry, BankingDb, BankingRecord, BankingSeed } from "./types.ts"

export type { BankingAuditEntry, BankingDb, BankingRecord, BankingSeed, BankingTable } from "./types.ts"

const clone = <T>(value: T): T => structuredClone(value)

export function createBankingEnvironment(seed: BankingSeed, options: { readLogAllowlist?: string[] } = {}) {
  const initial = clone(seed)
  const db = clone(initial)
  const unlocked = new Set<string>()
  let audit: BankingAuditEntry[] = []
  let sequence = 0
  const tools = createBankingTools({
    db,
    unlocked,
    readLogAllowlist: new Set(options.readLogAllowlist ?? []),
    record: (toolName: string, args: BankingRecord, result: string, mutated = false) => {
      audit.push({ seq: ++sequence, toolName, args: clone(args), result, ok: !result.startsWith("Error:") && !result.startsWith("Failed"), mutated })
      return result
    },
  })
  return {
    snapshot: () => clone(db),
    auditSnapshot: () => clone(audit),
    reset: () => { Object.keys(db).forEach(key => delete db[key]); Object.assign(db, clone(initial)); unlocked.clear(); audit = []; sequence = 0 },
    tools,
  }
}

export type BankingEnvironment = ReturnType<typeof createBankingEnvironment>
