export type BankingRecord = Record<string, unknown>
export type BankingTable = { data: Record<string, BankingRecord>; notes: string }
export type BankingDb = Record<string, BankingTable>
export type BankingSeed = BankingDb
export type BankingAuditEntry = { seq: number; toolName: string; args: BankingRecord; result: string; ok: boolean; mutated: boolean }
