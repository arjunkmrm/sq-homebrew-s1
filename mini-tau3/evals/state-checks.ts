import type { Account, BankState } from "../environment/bank/schema.ts"

export type StateCheck = {
  name: string
  pass: boolean
  detail: string
}

export type StateEvaluation = {
  pass: boolean
  checks: StateCheck[]
}

type TransferExpectation = {
  amountCents: number
  closeSavings: boolean
}

const supportedQueryIds = new Set([
  "check-savings-balance",
  "transfer-between-own-accounts",
  "transfer-and-close-savings",
  "close-savings",
  "transfer-over-balance",
])

function same(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}

function balanceTotal(state: BankState): number {
  return state.accounts.reduce((total, account) => total + account.balanceCents, 0)
}

function account(state: BankState, id: string): Account | undefined {
  return state.accounts.find((candidate) => candidate.id === id)
}

function sameMembers(left: string[], right: string[]): boolean {
  return left.length === right.length && new Set(left).size === left.length && left.every((id) => right.includes(id))
}

function sameAccountMetadata(before: Account, after: Account | undefined): boolean {
  return Boolean(
    after &&
      after.id === before.id &&
      after.customerId === before.customerId &&
      after.type === before.type &&
      after.currency === before.currency,
  )
}

function alexAccounts(before: BankState): { savings: Account; checking: Account } {
  const savings = before.accounts.find(
    (candidate) => candidate.customerId === "customer_alex" && candidate.type === "savings",
  )
  const checking = before.accounts.find(
    (candidate) => candidate.customerId === "customer_alex" && candidate.type === "checking",
  )

  if (!savings || !checking) {
    throw new Error("State checks require Alex's savings and checking accounts in the initial state.")
  }
  return { savings, checking }
}

function check(name: string, pass: boolean, detail: string): StateCheck {
  return { name, pass, detail }
}

function commonChecks(before: BankState, after: BankState, changedAccountIds: Set<string>): StateCheck[] {
  const beforeAccountIds = before.accounts.map((item) => item.id)
  const afterAccountIds = after.accounts.map((item) => item.id)
  const beforeTransactionIds = new Set(before.transactions.map((item) => item.id))
  const preexistingTransactions = before.transactions.every((transaction) =>
    after.transactions.some((candidate) => candidate.id === transaction.id && same(candidate, transaction)),
  )
  const unrelatedAccounts = before.accounts
    .filter((item) => !changedAccountIds.has(item.id))
    .every((item) => same(account(after, item.id), item))
  const accountMetadata = before.accounts.every((item) => sameAccountMetadata(item, account(after, item.id)))

  return [
    check("customers preserved", same(after.customers, before.customers), "Customer records are unchanged."),
    check(
      "account membership preserved",
      sameMembers(afterAccountIds, beforeAccountIds),
      "The same unique account IDs remain present.",
    ),
    check(
      "account metadata preserved",
      accountMetadata,
      "Account ID, owner, type, and currency are unchanged; only the requested balance and status may change.",
    ),
    check(
      "customer account membership preserved",
      same(
        after.customers.map((customer) => ({ id: customer.id, accountIds: customer.accountIds })),
        before.customers.map((customer) => ({ id: customer.id, accountIds: customer.accountIds })),
      ),
      "Every customer retains the same account IDs.",
    ),
    check("unrelated accounts preserved", unrelatedAccounts, "Accounts outside the requested operation are unchanged."),
    check(
      "preexisting transactions preserved",
      preexistingTransactions && after.transactions.filter((item) => beforeTransactionIds.has(item.id)).length === before.transactions.length,
      "No transaction that existed before the request was changed, removed, or duplicated.",
    ),
    check(
      "money conserved",
      balanceTotal(after) === balanceTotal(before),
      `Total balances are ${balanceTotal(before)} cents before and ${balanceTotal(after)} cents after.`,
    ),
  ]
}

function noChangeChecks(before: BankState, after: BankState): StateCheck[] {
  return [
    ...commonChecks(before, after, new Set()),
    check("no state changes", same(after, before), "This request must leave the bank state exactly unchanged."),
  ]
}

function transferChecks(before: BankState, after: BankState, expectation: TransferExpectation): StateCheck[] {
  const { savings, checking } = alexAccounts(before)
  const afterSavings = account(after, savings.id)
  const afterChecking = account(after, checking.id)
  const newTransactions = after.transactions.filter(
    (transaction) => !before.transactions.some((existing) => existing.id === transaction.id),
  )
  const transaction = newTransactions[0]
  const correctTransaction = Boolean(
    transaction &&
      transaction.sourceAccountId === savings.id &&
      transaction.destinationAccountId === checking.id &&
      transaction.amountCents === expectation.amountCents &&
      transaction.status === "completed" &&
      transaction.id.length > 0 &&
      new Set(after.transactions.map((item) => item.id)).size === after.transactions.length,
  )
  const expectedSavings = savings.balanceCents - expectation.amountCents
  const expectedChecking = checking.balanceCents + expectation.amountCents
  const expectedSavingsStatus = expectation.closeSavings ? "closed" : "open"

  return [
    ...commonChecks(before, after, new Set([savings.id, checking.id])),
    check(
      "transfer account results",
      afterSavings?.balanceCents === expectedSavings &&
        afterSavings.status === expectedSavingsStatus &&
        afterChecking?.balanceCents === expectedChecking &&
        afterChecking.status === checking.status,
      `Savings must be ${expectedSavings} cents and ${expectedSavingsStatus}; checking must be ${expectedChecking} cents and ${checking.status}.`,
    ),
    check(
      "one completed transfer recorded",
      newTransactions.length === 1 && correctTransaction,
      `Exactly one new completed transaction must move ${expectation.amountCents} cents from savings to checking with a unique ID.`,
    ),
  ]
}

export function evaluateState(queryId: string, before: BankState, after: BankState): StateEvaluation {
  if (!supportedQueryIds.has(queryId)) {
    throw new Error(`Unsupported query ID: ${queryId}`)
  }

  let checks: StateCheck[]
  switch (queryId) {
    case "check-savings-balance":
    case "close-savings":
    case "transfer-over-balance":
      checks = noChangeChecks(before, after)
      break
    case "transfer-between-own-accounts":
      checks = transferChecks(before, after, { amountCents: 50_000, closeSavings: false })
      break
    case "transfer-and-close-savings": {
      const { savings } = alexAccounts(before)
      checks = transferChecks(before, after, { amountCents: savings.balanceCents, closeSavings: true })
      break
    }
    default:
      throw new Error(`Unsupported query ID: ${queryId}`)
  }

  return { pass: checks.every((item) => item.pass), checks }
}
