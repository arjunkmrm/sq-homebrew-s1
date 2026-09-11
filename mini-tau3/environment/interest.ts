export type InterestAccount = {
  id: string
  userId: string
  kind: "saving" | "checking"
  product: string
  balanceCents: number
  status: "open"
}

export type Credit = { id: string; accountId: string; amountCents: number; creditType: string }
export type InterestReport = { id: string; accountId: string; userId: string; expectedApy: number; actualApy: number; amountDifferenceCents: number }
export type AuditEntry = { seq: number; action: string; ok: boolean; reason?: string; accountId?: string; details?: Record<string, unknown> }

export type InterestSeed = {
  customer: { id: string; name: string; phone: string; email: string; dateOfBirth: string; address: string }
  accounts: InterestAccount[]
  creditCards: Array<{ id: string; userId: string; product: string; status: "active" }>
  transactions: Array<{ id: string; accountId: string; date: string; description: string; amountCents: number; type: string; status: "posted" }>
}

export class InterestToolError extends Error {
  constructor(readonly code: string, message: string) { super(message) }
}

export function createInterestEnvironment(seed: InterestSeed) {
  const customerId = seed.customer.id
  const state = {
    customer: structuredClone(seed.customer), accounts: structuredClone(seed.accounts), creditCards: structuredClone(seed.creditCards),
    transactions: structuredClone(seed.transactions), credits: [] as Credit[], reports: [] as InterestReport[],
    verification: { verified: false, verifiedAtSeq: undefined as number | undefined },
    consent: { creditsAtSeq: undefined as number | undefined, reportsAtSeq: undefined as number | undefined },
    audit: [] as AuditEntry[],
  }
  let sequence = 0
  const log = (entry: Omit<AuditEntry, "seq">) => { const value = { seq: ++sequence, ...entry }; state.audit.push(value); return value.seq }
  const reject = (action: string, code: string, message: string, accountId?: string): never => {
    log({ action, ok: false, reason: code, accountId }); throw new InterestToolError(code, message)
  }
  const requireVerified = (action: string) => { if (!state.verification.verified) reject(action, "VERIFICATION_REQUIRED", "Verify the customer's identity first.") }
  const ownedSavings = (action: string, accountId: string) => {
    const account = state.accounts.find(a => a.id === accountId && a.userId === customerId)
    if (!account) reject(action, "ACCOUNT_NOT_FOUND", "No owned account has that ID.", accountId)
    const owned = account!
    if (owned.kind !== "saving") reject(action, "SAVINGS_REQUIRED", "This operation requires a savings account.", accountId)
    return owned
  }

  return {
    snapshot() { return structuredClone(state) },
    searchDocuments(input: { query: string; limit?: number }) {
      const matches = searchDocuments(input)
      log({ action: "search_documents", ok: true, details: { query: input.query, resultCount: matches.length } }); return matches
    },
    getDocument(input: { documentId: string }) {
      try {
        const doc = getDocument(input)
        log({ action: "get_document", ok: true, details: { documentId: doc.id } }); return doc
      } catch {
        return reject("get_document", "DOCUMENT_NOT_FOUND", "No document has that ID.")
      }
    },
    verifyCustomer(input: { name: string; phone: string; email: string; dateOfBirth: string; address: string }) {
      const ok = input.name === state.customer.name && input.phone === state.customer.phone && input.email === state.customer.email && input.dateOfBirth === state.customer.dateOfBirth && input.address === state.customer.address
      const seq = log({ action: "verify_customer", ok, reason: ok ? undefined : "IDENTITY_MISMATCH" })
      if (!ok) throw new InterestToolError("IDENTITY_MISMATCH", "The supplied details do not match the customer record.")
      state.verification = { verified: true, verifiedAtSeq: seq }; return { verified: true, userId: customerId }
    },
    getAllAccounts(input: { userId: string }) {
      requireVerified("get_all_accounts")
      if (input.userId !== customerId) reject("get_all_accounts", "CUSTOMER_NOT_FOUND", "Unknown customer.")
      log({ action: "get_all_accounts", ok: true }); return { accounts: structuredClone(state.accounts), creditCards: structuredClone(state.creditCards) }
    },
    getTransactions(input: { accountId: string }) {
      requireVerified("get_transactions"); const account = state.accounts.find(a => a.id === input.accountId && a.userId === customerId)
      if (!account) reject("get_transactions", "ACCOUNT_NOT_FOUND", "No owned account has that ID.", input.accountId)
      log({ action: "get_transactions", ok: true, accountId: input.accountId }); return structuredClone(state.transactions.filter(t => t.accountId === input.accountId))
    },
    recordCustomerMessage(text: string) {
      const normalized = text.toLowerCase()
      const affirmative = /^(yes\b|please\b|i (?:authorize|consent)\b|go ahead\b)/.test(normalized.trim())
      const creditConsent = affirmative && /\b(credits?|owed|differences?)\b/.test(normalized)
      const reportConsent = affirmative && /\b(report|reports)\b/.test(normalized)
      const seq = log({ action: "customer_message", ok: true, details: { text } })
      if (creditConsent) state.consent.creditsAtSeq ??= seq
      if (reportConsent) state.consent.reportsAtSeq ??= seq
      return { recorded: true, consent: { credits: creditConsent, reports: reportConsent } }
    },
    applyCredit(input: { accountId: string; amountCents: number; creditType: string }) {
      requireVerified("applyCredit"); const account = ownedSavings("applyCredit", input.accountId)
      if (!state.consent.creditsAtSeq) reject("applyCredit", "CONSENT_REQUIRED", "Ask for and receive explicit customer consent before applying credits.", input.accountId)
      if (!Number.isSafeInteger(input.amountCents) || input.amountCents <= 0) reject("applyCredit", "INVALID_AMOUNT", "Amount must be positive whole cents.", input.accountId)
      if (input.creditType !== "interest_correction") reject("applyCredit", "INVALID_CREDIT_TYPE", "This investigation only permits interest_correction.", input.accountId)
      if (!Number.isSafeInteger(account.balanceCents + input.amountCents)) reject("applyCredit", "BALANCE_OVERFLOW", "The resulting balance exceeds the supported range.", input.accountId)
      account.balanceCents += input.amountCents
      const credit = { id: `credit_${state.credits.length + 1}`, ...input }; state.credits.push(credit)
      state.transactions.unshift({ id: credit.id, accountId: input.accountId, date: "11/14/2025", description: "INTEREST CORRECTION", amountCents: input.amountCents, type: "interest_correction", status: "posted" })
      log({ action: "applyCredit", ok: true, accountId: input.accountId, details: { amountCents: input.amountCents, creditType: input.creditType } }); return structuredClone(credit)
    },
    submitReport(input: Omit<InterestReport, "id">) {
      requireVerified("submitReport"); ownedSavings("submitReport", input.accountId)
      if (input.userId !== customerId) reject("submitReport", "OWNERSHIP_MISMATCH", "The report user does not own this account.", input.accountId)
      if (!state.consent.reportsAtSeq) reject("submitReport", "CONSENT_REQUIRED", "Ask for and receive explicit customer consent before submitting reports.", input.accountId)
      if (!state.credits.some(c => c.accountId === input.accountId)) reject("submitReport", "CREDIT_REQUIRED", "Apply the correction credit before submitting its report.", input.accountId)
      if (!Number.isFinite(input.expectedApy) || !Number.isFinite(input.actualApy) || !Number.isSafeInteger(input.amountDifferenceCents) || input.amountDifferenceCents <= 0) reject("submitReport", "INVALID_REPORT", "APYs must be finite and the difference must be positive whole cents.", input.accountId)
      const report = { id: `report_${state.reports.length + 1}`, ...input }; state.reports.push(report)
      log({ action: "submitReport", ok: true, accountId: input.accountId, details: { expectedApy: input.expectedApy, actualApy: input.actualApy, amountDifferenceCents: input.amountDifferenceCents } }); return structuredClone(report)
    },
  }
}

export type InterestEnvironment = ReturnType<typeof createInterestEnvironment>
import { getDocument, searchDocuments } from "./knowledge/index.ts"
