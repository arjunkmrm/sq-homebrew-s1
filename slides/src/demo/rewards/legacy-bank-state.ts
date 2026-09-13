export type LegacyAccount = {
  id: string
  customerId: string
  type: "checking" | "savings"
  balanceCents: number
  currency: "USD"
  status: "open" | "closed"
}

export type LegacyBankState = {
  customers: Array<{ id: string; name: string; accountIds: string[] }>
  accounts: LegacyAccount[]
  transactions: Array<{ id: string; sourceAccountId: string; destinationAccountId: string; amountCents: number; status: "pending" | "completed" }>
}
