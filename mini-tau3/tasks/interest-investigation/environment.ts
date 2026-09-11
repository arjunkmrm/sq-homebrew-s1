export const CUSTOMER_ID = "mc80w7k3x9"

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

const customer = {
  id: CUSTOMER_ID,
  name: "Marcus Chen-Williams",
  phone: "206-555-4729",
  email: "marcus.chenwilliams@gmail.com",
  dateOfBirth: "07/18/1980",
  address: "2934 Queen Anne Avenue North, Unit 8B, Seattle, WA 98109",
}

const accountSeed: InterestAccount[] = [
  ["sav_mc80w7k3x9_silver", "saving", "Silver Account", 10_000_000],
  ["sav_mc80w7k3x9_platinum", "saving", "Platinum Account", 7_000_000],
  ["sav_mc80w7k3x9_diamond", "saving", "Diamond Elite Account", 12_000_000],
  ["sav_mc80w7k3x9_silverplus", "saving", "Silver Plus Account", 1_800_000],
  ["chk_mc80w7k3x9_bluest", "checking", "Bluest Account", 5_000_000],
  ["chk_mc80w7k3x9_blue", "checking", "Blue Account", 800_000],
  ["chk_mc80w7k3x9_lightgreen", "checking", "Light Green Account", 300_000],
  ["chk_mc80w7k3x9_evergreen", "checking", "Evergreen Account", 1_500_000],
].map(([id, kind, product, balanceCents]) => ({ id, userId: CUSTOMER_ID, kind, product, balanceCents, status: "open" }) as InterestAccount)

const cardSeed = ["Silver Rewards Card", "EcoCard", "Bronze Rewards Card", "Crypto-Cash Back Card", "Diamond Elite Card"].map((product, index) => ({
  id: `card_${index + 1}`, userId: CUSTOMER_ID, product, status: "active" as const,
}))

const transactionSeed = [
  ["sav_mc80w7k3x9_silver", 33_333],
  ["sav_mc80w7k3x9_platinum", 37_917],
  ["sav_mc80w7k3x9_diamond", 75_000],
  ["sav_mc80w7k3x9_silverplus", 6_750],
].map(([accountId, amountCents], index) => ({ id: `interest_oct_${index + 1}`, accountId, date: "10/31/2025", description: "MONTHLY INTEREST CREDIT", amountCents, type: "interest_credit", status: "posted" as const }))

export class InterestToolError extends Error {
  constructor(readonly code: string, message: string) { super(message) }
}

export function createInterestEnvironment() {
  const state = {
    customer: structuredClone(customer), accounts: structuredClone(accountSeed), creditCards: structuredClone(cardSeed),
    transactions: structuredClone(transactionSeed), credits: [] as Credit[], reports: [] as InterestReport[],
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
    const account = state.accounts.find(a => a.id === accountId && a.userId === CUSTOMER_ID)
    if (!account) reject(action, "ACCOUNT_NOT_FOUND", "No owned account has that ID.", accountId)
    const owned = account!
    if (owned.kind !== "saving") reject(action, "SAVINGS_REQUIRED", "This operation requires a savings account.", accountId)
    return owned
  }

  return {
    snapshot() { return structuredClone(state) },
    searchDocuments(input: { query: string }) {
      const query = input.query.trim().toLowerCase()
      const terms = query.split(/\s+/).filter(term => term.length > 2)
      const matches = DOCUMENTS.filter(doc => terms.length === 0 || terms.some(term => `${doc.title} ${doc.content}`.toLowerCase().includes(term)))
        .map(({ id, title, content }) => ({ id, title, excerpt: content.slice(0, 260) }))
      log({ action: "search_documents", ok: true, details: { query, resultCount: matches.length } }); return matches
    },
    getDocument(input: { documentId: string }) {
      const doc = DOCUMENTS.find(item => item.id === input.documentId)
      if (!doc) reject("get_document", "DOCUMENT_NOT_FOUND", "No document has that ID.")
      log({ action: "get_document", ok: true, details: { documentId: doc!.id } }); return structuredClone(doc!)
    },
    verifyCustomer(input: { name: string; phone: string; email: string; dateOfBirth: string; address: string }) {
      const ok = input.name === customer.name && input.phone === customer.phone && input.email === customer.email && input.dateOfBirth === customer.dateOfBirth && input.address === customer.address
      const seq = log({ action: "verify_customer", ok, reason: ok ? undefined : "IDENTITY_MISMATCH" })
      if (!ok) throw new InterestToolError("IDENTITY_MISMATCH", "The supplied details do not match the customer record.")
      state.verification = { verified: true, verifiedAtSeq: seq }; return { verified: true, userId: CUSTOMER_ID }
    },
    getAllAccounts(input: { userId: string }) {
      requireVerified("get_all_accounts")
      if (input.userId !== CUSTOMER_ID) reject("get_all_accounts", "CUSTOMER_NOT_FOUND", "Unknown customer.")
      log({ action: "get_all_accounts", ok: true }); return { accounts: structuredClone(state.accounts), creditCards: structuredClone(state.creditCards) }
    },
    getTransactions(input: { accountId: string }) {
      requireVerified("get_transactions"); const account = state.accounts.find(a => a.id === input.accountId && a.userId === CUSTOMER_ID)
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
      if (input.userId !== CUSTOMER_ID) reject("submitReport", "OWNERSHIP_MISMATCH", "The report user does not own this account.", input.accountId)
      if (!state.consent.reportsAtSeq) reject("submitReport", "CONSENT_REQUIRED", "Ask for and receive explicit customer consent before submitting reports.", input.accountId)
      if (!state.credits.some(c => c.accountId === input.accountId)) reject("submitReport", "CREDIT_REQUIRED", "Apply the correction credit before submitting its report.", input.accountId)
      if (!Number.isFinite(input.expectedApy) || !Number.isFinite(input.actualApy) || !Number.isSafeInteger(input.amountDifferenceCents) || input.amountDifferenceCents <= 0) reject("submitReport", "INVALID_REPORT", "APYs must be finite and the difference must be positive whole cents.", input.accountId)
      const report = { id: `report_${state.reports.length + 1}`, ...input }; state.reports.push(report)
      log({ action: "submitReport", ok: true, accountId: input.accountId, details: { expectedApy: input.expectedApy, actualApy: input.actualApy, amountDifferenceCents: input.amountDifferenceCents } }); return structuredClone(report)
    },
  }
}

export type InterestEnvironment = ReturnType<typeof createInterestEnvironment>

const DOCUMENTS = [
  { id: "silver-rates", title: "Silver Account interest and card bonuses", content: "Balances of $10,000 or more earn 4.0% APY. Card bonuses: Bronze Rewards 0%; Silver Rewards +0.1%; Gold Rewards +0.5%; EcoCard +2.2%; Green Rewards 0%; Crypto-Cash Back +0.5%; Diamond Elite Card 0%." },
  { id: "platinum-rates", title: "Platinum Account interest and card bonuses", content: "Platinum earns 6.5% APY. Card bonuses: Bronze Rewards 0%; Silver Rewards 0%; Gold Rewards +0.15%; Platinum Rewards +0.25%; Diamond Elite Card +0.35%; EcoCard 0%; Green Rewards 0%; Crypto-Cash Back 0%." },
  { id: "diamond-rates", title: "Diamond Elite Account interest and card bonuses", content: "Diamond Elite earns 7.5% APY. Card bonuses: Bronze Rewards 0%; Silver Rewards 0%; Gold Rewards 0%; Platinum Rewards +0.1%; Diamond Elite Card +0.5%; EcoCard 0%; Green Rewards 0%; Crypto-Cash Back +0.15%." },
  { id: "silver-plus-rates", title: "Silver Plus Account interest and card bonuses", content: "Balances of $15,000 or more earn 4.5% APY. Card bonuses: Bronze Rewards +0.15%; Silver Rewards +0.15%; Gold Rewards +0.2%; Platinum Rewards +0.15%; Diamond Elite Card +0.4%; EcoCard +0.45%; Green Rewards +0.1%; Crypto-Cash Back 0%." },
  { id: "checking-boosts", title: "Linked checking APY boost matrix", content: "Savings boosts: Bluest + Silver: +0.45%. Blue + Platinum: +0.8%. Light Green + Platinum: +0.65%. Light Green + Diamond Elite: +0.2%. Evergreen + Diamond Elite: +0.15%. Blue + Silver Plus: +0.35%. Unlisted pairings add 0%." },
  { id: "nonstacking", title: "APY bonus selection and stacking policy", content: "Checking boosts do not stack with other checking boosts: use only the highest applicable checking boost. Credit-card bonuses do not stack with other card bonuses: use only the highest applicable card bonus. The selected checking boost and selected card bonus do stack with the base APY." },
  { id: "interest-method", title: "Monthly interest calculation", content: "For this investigation, calculate one month as balance × APY percentage ÷ 12. Compare it with the posted monthly interest credit. Express corrections to the nearest cent." },
  { id: "correction-procedure", title: "Interest correction procedure", content: "First verify identity. Retrieve owned accounts and transaction history. Review the product documents and calculate the discrepancy. Obtain explicit customer consent before credits. Apply each correction before its report. Obtain explicit consent before submitting reports." },
]
