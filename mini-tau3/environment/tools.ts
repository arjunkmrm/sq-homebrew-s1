import { getDocument, searchDocuments } from "./knowledge/index.ts"
import { createHash } from "node:crypto"
import type { BankingDb, BankingRecord } from "./types.ts"

const TODAY = "11/14/2025"
const NOW = "2025-11-14 03:40:00 EST"
const DISCOVERABLE = new Set([
  "get_all_user_accounts_by_user_id_3847", "get_bank_account_transactions_9173",
  "transfer_funds_between_bank_accounts_7291", "close_bank_account_7392",
  "open_bank_account_4821", "apply_checking_account_credit_5829", "apply_savings_account_credit_6831", "submit_interest_discrepancy_report_7294",
])
const MUTATING = new Set(["transfer_funds_between_bank_accounts_7291", "close_bank_account_7392", "open_bank_account_4821", "apply_checking_account_credit_5829", "apply_savings_account_credit_6831", "submit_interest_discrepancy_report_7294"])
const TOOL_INFO: Record<string, { description: string; parameters: Array<[string, string, boolean, string]> }> = {
  get_all_user_accounts_by_user_id_3847: { description: "Retrieve all accounts (checking, savings, credit cards) for a customer.", parameters: [["user_id", "string", true, "The customer's unique identifier in the system"]] },
  get_bank_account_transactions_9173: { description: "Retrieve the transaction history for a bank account. Transactions are returned in reverse chronological order (most recent first).", parameters: [["account_id", "string", true, "The bank account ID to retrieve transactions for"]] },
  transfer_funds_between_bank_accounts_7291: { description: "Transfer funds from one bank account to another.", parameters: [["source_account_id", "string", true, "The account ID to transfer funds from"], ["destination_account_id", "string", true, "The account ID to transfer funds to"], ["amount", "number", true, "The amount to transfer in USD"]] },
  close_bank_account_7392: { description: "Close a customer's bank account (checking or savings).", parameters: [["account_id", "string", true, "The ID of the bank account to close"], ["reason", "string", false, "The reason for closing the account"], ["waive_early_closure_fee", "boolean", false, "Whether to waive early closure fees"]] },
  open_bank_account_4821: { description: "Open a new bank account for a customer.", parameters: [["user_id", "string", true, "The customer's unique identifier in the system"], ["account_type", "string", true, "One of checking, savings, business_checking, business_savings"], ["account_class", "string", true, "The full official account class name"]] },
  apply_checking_account_credit_5829: { description: "Apply a credit to a customer's checking account.", parameters: [["account_id", "string", true, "The checking account ID to credit"], ["amount", "number", true, "The positive dollar amount to credit"], ["credit_type", "string", true, "One of rebate_credit or fee_refund"]] },
  apply_savings_account_credit_6831: { description: "Apply a credit to a customer's savings account for interest corrections, fee refunds, or goodwill adjustments.", parameters: [["account_id", "string", true, "The savings account ID to credit"], ["amount", "number", true, "The positive dollar amount to credit (must be greater than 0)"], ["credit_type", "string", true, "One of interest_correction, fee_refund, or goodwill_credit"]] },
  submit_interest_discrepancy_report_7294: { description: "Submit a report for interest calculation discrepancies to the backend team for investigation.", parameters: [["account_id", "string", true, "The savings account ID with the discrepancy"], ["user_id", "string", true, "The customer's unique identifier"], ["expected_apy", "number", true, "The APY percentage the customer should have received"], ["actual_apy", "number", true, "The APY percentage actually applied"], ["amount_difference", "number", true, "The dollar amount difference"]] },
}

const clone = <T>(value: T): T => structuredClone(value)
const hash = (seed: string, length = 16) => createHash("sha256").update(seed).digest("hex").slice(0, length)
const pythonFloat = (value: unknown): number | undefined => {
  if (typeof value === "boolean") return value ? 1 : 0
  if (typeof value !== "number" && typeof value !== "string") return undefined
  if (typeof value === "string" && value.trim() === "") return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}
const balance = (record: BankingRecord) => Number(String(record.current_holdings ?? "0").replaceAll("$", "").replaceAll(",", ""))
const table = (db: BankingDb, name: string) => db[name] ??= { data: {}, notes: "" }
const formatQuery = (db: BankingDb, name: string, predicate: (record: BankingRecord) => boolean) => {
  const rows = Object.entries(table(db, name).data).filter(([, record]) => predicate(record))
  if (!rows.length) return `No records found in '${name}'.`
  const lines = [`Found ${rows.length} record(s) in '${name}':\n`]
  rows.forEach(([id, record], index) => { lines.push(`${index + 1}. Record ID: ${id}`); Object.entries(record).forEach(([key, value]) => lines.push(`   ${key}: ${value}`)); lines.push("") })
  return lines.join("\n")
}

export function createBankingTools({ db, unlocked, readLogAllowlist, record }: {
  db: BankingDb
  unlocked: Set<string>
  readLogAllowlist: ReadonlySet<string>
  record: (toolName: string, args: BankingRecord, result: string, mutated?: boolean) => string
}) {
  const userQuery = (field: string, value: string) => formatQuery(db, "users", record => record[field] === value)

  const specialized = (name: string, args: BankingRecord): string => {
    if (name === "get_all_user_accounts_by_user_id_3847") {
      const userId = String(args.user_id ?? "")
      if (!userId) return "Error: Missing required parameter: user_id"
      return ["User accounts retrieved successfully.", "", "Executed: get_all_user_accounts_by_user_id_3847", `Accounts for user ${userId}:`, "", "Bank Accounts:", formatQuery(db, "accounts", row => row.user_id === userId), "\nCredit Card Accounts:", formatQuery(db, "credit_card_accounts", row => row.user_id === userId)].join("\n")
    }
    if (name === "get_bank_account_transactions_9173") {
      const accountId = String(args.account_id ?? "")
      if (!accountId) return "Error: Missing required parameter: account_id"
      if (!table(db, "accounts").data[accountId]) return `Error: Account '${accountId}' not found.`
      const rows = Object.entries(table(db, "bank_account_transaction_history").data).filter(([, row]) => row.account_id === accountId)
        .sort(([, a], [, b]) => Date.parse(String(b.date)) - Date.parse(String(a.date)))
      const body = rows.length ? (() => { const lines = [`Found ${rows.length} record(s) in 'bank_account_transaction_history':\n`]; rows.forEach(([id, row], i) => { lines.push(`${i + 1}. Record ID: ${id}`); Object.entries(row).forEach(([k, v]) => lines.push(`   ${k}: ${v}`)); lines.push("") }); return lines.join("\n") })() : "\nNo transactions found for this account."
      return ["Bank account transactions retrieved successfully.", "", "Executed: get_bank_account_transactions_9173", `Transactions for account ${accountId}:`, body].join("\n")
    }
    if (name === "transfer_funds_between_bank_accounts_7291") {
      const sourceId = String(args.source_account_id ?? ""), destinationId = String(args.destination_account_id ?? ""), amount = pythonFloat(args.amount)
      if (!sourceId || !destinationId || args.amount == null) return "Error: Missing required parameters (source_account_id, destination_account_id, amount)."
      if (amount === undefined) return `Error: Invalid amount '${args.amount}'. Must be a number.`
      if (amount <= 0) return "Error: Transfer amount must be positive."
      if (sourceId === destinationId) return "Error: Source and destination accounts cannot be the same."
      const source = table(db, "accounts").data[sourceId], destination = table(db, "accounts").data[destinationId]
      if (!source) return `Error: Source account '${sourceId}' not found.`
      if (!destination) return `Error: Destination account '${destinationId}' not found.`
      if (!(["ACTIVE", "OPEN"] as unknown[]).includes(source.status)) return `Error: Source account '${sourceId}' is not active.`
      if (!(["ACTIVE", "OPEN"] as unknown[]).includes(destination.status)) return `Error: Destination account '${destinationId}' is not active.`
      const from = balance(source), to = balance(destination)
      if (from < amount) return `Error: Insufficient funds. Source account balance is $${from.toFixed(2)}, but transfer amount is $${amount.toFixed(2)}.`
      source.current_holdings = `$${(from - amount).toFixed(2)}`; destination.current_holdings = `$${(to + amount).toFixed(2)}`
      return `Transfer completed successfully!\n  - Amount: $${amount.toFixed(2)}\n  - From: ${sourceId} (new balance: $${(from - amount).toFixed(2)})\n  - To: ${destinationId} (new balance: $${(to + amount).toFixed(2)})`
    }
    if (name === "open_bank_account_4821") {
      const userId = String(args.user_id ?? ""), accountType = String(args.account_type ?? ""), accountClass = String(args.account_class ?? "")
      if (!userId || !accountType || !accountClass) return "Error: Missing required parameters."
      const valid = ["checking", "savings", "business_checking", "business_savings"]
      if (!valid.includes(accountType)) return `Error: Invalid account_type. Must be one of: ${JSON.stringify(valid).replaceAll('"', "'")}`
      const accounts = Object.values(table(db, "accounts").data).filter(account => account.user_id === userId)
      const age = (record: BankingRecord) => { const parsed = Date.parse(String(record.date_opened ?? "")); return Number.isFinite(parsed) ? Math.floor((Date.parse(TODAY) - parsed) / 86_400_000) : 0 }
      const type = (record: BankingRecord) => String(record.account_type ?? record.class ?? "")
      if (accountType === "savings" && !accounts.some(account => ["checking", "personal_checking"].includes(type(account)) && ["OPEN", "ACTIVE"].includes(String(account.status)) && age(account) >= 14)) return "Error: Account eligibility requirements not met."
      if (accountType === "business_checking" && (accounts.some(account => account.status === "CLOSED") || !accounts.some(account => ["checking", "personal_checking"].includes(type(account)) && ["OPEN", "ACTIVE"].includes(String(account.status))))) return "Error: Account eligibility requirements not met."
      if (accountType === "business_savings" && (accounts.some(account => balance(account) < 0) || !accounts.some(account => type(account) === "business_checking" && ["OPEN", "ACTIVE"].includes(String(account.status)) && age(account) >= 30))) return "Error: Account eligibility requirements not met."
      const id = hash(`account:${userId}:${accountType}:${accountClass}`), target = table(db, "accounts").data
      if (target[id]) return `Failed to open account: Account ID '${id}' may already exist.`
      target[id] = { account_id: id, user_id: userId, account_type: accountType, account_class: accountClass, current_holdings: "0.00", status: "OPEN", date_opened: TODAY }
      return `Bank account opened successfully!\n  - Account ID: ${id}\n  - User ID: ${userId}\n  - Account Type: ${accountType}\n  - Account Class: ${accountClass}\n  - Status: OPEN\n  - Initial Balance: $0.00\n  - Date Opened: ${TODAY}`
    }
    if (name === "close_bank_account_7392") {
      const accountId = String(args.account_id ?? ""), reason = String(args.reason ?? "Customer requested closure"), waived = Boolean(args.waive_early_closure_fee ?? false)
      if (!accountId) return "Error: Missing required parameter (account_id)."
      const account = table(db, "accounts").data[accountId]
      if (!account) return `Error: Account '${accountId}' not found.`
      if (account.status === "CLOSED") return `Error: Account '${accountId}' is already closed.`
      const current = balance(account)
      const closure: Record<string, { fee: number; days: number }> = {
        "Light Blue Account": { fee: 15, days: 30 }, "Light Green Account": { fee: 15, days: 30 }, "Green Fee-Free Account": { fee: 15, days: 30 },
        "Blue Account": { fee: 25, days: 60 }, "Green Account": { fee: 25, days: 60 }, "Evergreen Account": { fee: 50, days: 90 }, "Bluest Account": { fee: 100, days: 180 },
        "Bronze Account": { fee: 20, days: 60 }, "Silver Account": { fee: 35, days: 90 }, "Silver Plus Account": { fee: 35, days: 90 },
        "Gold Account": { fee: 75, days: 180 }, "Gold Plus Account": { fee: 75, days: 180 }, "Gold Years Account": { fee: 75, days: 180 },
        "Platinum Account": { fee: 150, days: 270 }, "Platinum Plus Account": { fee: 150, days: 270 }, "Diamond Elite Account": { fee: 150, days: 270 },
      }
      let earlyFee = 0
      const config = closure[String(account.level ?? "")], opened = /^\d{2}\/\d{2}\/\d{4}$/.test(String(account.date_opened ?? "")) ? new Date(`${String(account.date_opened).slice(6)}-${String(account.date_opened).slice(0, 2)}-${String(account.date_opened).slice(3, 5)}T03:40:00`) : undefined
      if (!waived && config && opened && (new Date("2025-11-14T03:40:00").getTime() - opened.getTime()) / 86_400_000 < config.days) {
        if (current < config.fee) return "Error: Account unable to be closed."
        earlyFee = config.fee
      }
      if (current - earlyFee !== 0) return `Error: Account balance must be $0.00 before closing. Current balance: $${current.toFixed(2)}`
      account.status = "CLOSED"; account.date_closed = TODAY; account.closure_reason = reason; account.early_closure_fee_waived = waived
      return `Bank account closed successfully!\n  - Account ID: ${accountId}\n  - Account Type: ${account.account_type ?? "N/A"}\n  - Account Class: ${account.account_class ?? "N/A"}\n  - Status: CLOSED\n  - Date Closed: ${TODAY}\n  - Reason: ${reason}\n  - Early Closure Fee Waived: ${waived ? "Yes" : "No"}`
    }
    if (name === "apply_savings_account_credit_6831") {
      const accountId = String(args.account_id ?? ""), amount = pythonFloat(args.amount), creditType = String(args.credit_type ?? "")
      if (!accountId || args.amount == null || !creditType) return "Error: Missing required parameters."
      if (amount === undefined) return "Error: Invalid credit amount. Must be a number."
      if (amount <= 0) return "Error: Credit amount must be positive."
      const valid = ["interest_correction", "fee_refund", "goodwill_credit"]
      if (!valid.includes(creditType)) return `Error: Invalid credit_type. Must be one of: ${JSON.stringify(valid).replaceAll('"', "'")}`
      const account = table(db, "accounts").data[accountId]
      if (!account) return `Error: Account '${accountId}' not found.`
      if (!["saving", "savings"].includes(String(account.class ?? "").toLowerCase())) return `Error: Account '${accountId}' is not a savings account. This tool only applies to savings accounts.`
      if (!(["ACTIVE", "OPEN"] as unknown[]).includes(account.status)) return `Error: Account '${accountId}' is not active.`
      const previous = balance(account), next = previous + amount
      account.current_holdings = next.toFixed(2)
      const amountText = Number.isInteger(amount) ? `${amount.toFixed(1)}` : String(amount)
      const id = `txn_${hash(`savings_credit:${accountId}:${creditType}:${amountText}:${TODAY}`)}`
      const descriptions: Record<string, string> = { interest_correction: "INTEREST CORRECTION - CUSTOMER SERVICE", fee_refund: "FEE REFUND - CUSTOMER SERVICE", goodwill_credit: "GOODWILL CREDIT - CUSTOMER SERVICE" }
      table(db, "bank_account_transaction_history").data[id] = { transaction_id: id, account_id: accountId, date: TODAY, description: descriptions[creditType], amount, type: creditType, status: "posted" }
      return `\nCredit applied successfully!\n  - Transaction ID: ${id}\n  - Account: ${accountId}\n  - Credit Type: ${creditType}\n  - Amount: $${amount.toFixed(2)}\n  - Previous Balance: $${previous.toFixed(2)}\n  - New Balance: $${next.toFixed(2)}`
    }
    if (name === "apply_checking_account_credit_5829") {
      const accountId = String(args.account_id ?? ""), amount = pythonFloat(args.amount), creditType = String(args.credit_type ?? "")
      if (!accountId || args.amount == null || !creditType) return "Error: Missing required parameters."
      if (amount === undefined) return "Error: Invalid credit amount. Must be a number."
      if (amount <= 0) return "Error: Credit amount must be positive."
      const valid = ["rebate_credit", "fee_refund"]
      if (!valid.includes(creditType)) return `Error: Invalid credit_type. Must be one of: ${JSON.stringify(valid).replaceAll('"', "'")}`
      const account = table(db, "accounts").data[accountId]
      if (!account) return `Error: Account '${accountId}' not found.`
      if (String(account.class ?? "").toLowerCase() !== "checking") return `Error: Account '${accountId}' is not a checking account. Credits can only be applied to checking accounts.`
      if (!["ACTIVE", "OPEN"].includes(String(account.status))) return `Error: Account '${accountId}' is not active.`
      const previous = balance(account), next = previous + amount
      account.current_holdings = `$${next.toFixed(2)}`
      const amountText = Number.isInteger(amount) ? amount.toFixed(1) : String(amount)
      const id = `txn_${hash(`checking_credit:${accountId}:${creditType}:${amountText}:${TODAY}`)}`
      table(db, "bank_account_transaction_history").data[id] = { transaction_id: id, account_id: accountId, date: TODAY, description: creditType === "rebate_credit" ? "REBATE CREDIT - CUSTOMER SERVICE" : "FEE REFUND - CUSTOMER SERVICE", amount, type: creditType, status: "posted" }
      return `\nCredit applied successfully!\n  - Transaction ID: ${id}\n  - Account: ${accountId}\n  - Credit Type: ${creditType}\n  - Amount: $${amount.toFixed(2)}\n  - Previous Balance: $${previous.toFixed(2)}\n  - New Balance: $${next.toFixed(2)}`
    }
    if (name === "submit_interest_discrepancy_report_7294") {
      const accountId = String(args.account_id ?? ""), userId = String(args.user_id ?? ""), expected = pythonFloat(args.expected_apy), actual = pythonFloat(args.actual_apy), difference = pythonFloat(args.amount_difference)
      if (!accountId || !userId || args.expected_apy == null || args.actual_apy == null || args.amount_difference == null) return "Error: Missing required parameters."
      if (expected === undefined || actual === undefined || difference === undefined) return "Error: expected_apy, actual_apy, and amount_difference must be numbers."
      const account = table(db, "accounts").data[accountId], user = table(db, "users").data[userId]
      if (!account) return `Error: Account '${accountId}' not found.`
      if (!user) return `Error: User '${userId}' not found.`
      const pyFloat = (value: number) => Number.isInteger(value) ? value.toFixed(1) : String(value)
      const id = `IDR_${hash(`interest_report:${accountId}:${userId}:${pyFloat(expected)}:${pyFloat(actual)}:${TODAY}`)}`
      const apyDifference = Math.round((expected - actual) * 10_000) / 10_000
      table(db, "interest_discrepancy_reports").data[id] = { report_id: id, account_id: accountId, user_id: userId, account_level: account.level ?? "Unknown", expected_apy: expected, actual_apy: actual, apy_difference: apyDifference, amount_difference: difference, submitted_date: TODAY, status: "PENDING_REVIEW" }
      return `\nInterest Discrepancy Report Submitted Successfully!\n  - Report ID: ${id}\n  - Account: ${accountId} (${account.level ?? "Unknown"})\n  - Customer: ${user.name ?? "Unknown"}\n  - Expected APY: ${expected}%\n  - Actual APY: ${actual}%\n  - APY Difference: ${apyDifference}%\n  - Amount Difference: $${difference.toFixed(2)}\n  - Status: PENDING_REVIEW\n\nThe backend team will investigate this discrepancy and ensure correct APY calculations are applied going forward.`
    }
    return `Error: Unknown agent tool '${name}'. This tool is not available.`
  }

  const tools = {
    search_documents: (args: { query: string; limit?: number }) => searchDocuments(args),
    get_document: (args: { documentId: string }) => getDocument(args),
    get_current_time: () => record("get_current_time", {}, `The current time is ${NOW}.`),
    get_user_information_by_id: (args: { user_id: string }) => record("get_user_information_by_id", args, userQuery("user_id", args.user_id)),
    get_user_information_by_name: (args: { customer_name: string }) => record("get_user_information_by_name", args, userQuery("name", args.customer_name)),
    get_user_information_by_email: (args: { email: string }) => record("get_user_information_by_email", args, userQuery("email", args.email)),
    log_verification: (args: { name: string; user_id: string; address: string; email: string; phone_number: string; date_of_birth: string; time_verified: string }) => {
      const id = `${args.user_id}_${args.time_verified.replaceAll(" ", "_").replaceAll(":", "").replaceAll("-", "")}`, target = table(db, "verification_history").data
      if (target[id]) return record("log_verification", args, "Failed to log verification: Record may already exist.")
      target[id] = clone(args); return record("log_verification", args, `Verification logged successfully.\n  - User: ${args.name} (ID: ${args.user_id})\n  - Verified at: ${args.time_verified}`, true)
    },
    unlock_discoverable_agent_tool: (args: { agent_tool_name: string }) => {
      const name = args.agent_tool_name
      const info = TOOL_INFO[name]
      const formatted = info ? `Tool: ${name}\nDescription: ${info.description}\nParameters:\n${info.parameters.map(([parameter, type, required, description]) => `  - ${parameter}: ${type} (${required ? "required" : "optional"}) - ${description}`).join("\n")}` : ""
      const result = info ? `Tool unlocked: ${name}\nDescription: ${info.description}\n\n${formatted}\n\nYou can now use this tool by calling \`call_discoverable_agent_tool\` with agent_tool_name='${name}' and the required arguments.` : `Error: Unknown agent tool '${name}'. This tool is not available.`
      if (DISCOVERABLE.has(name)) unlocked.add(name)
      return record("unlock_discoverable_agent_tool", args, result, false)
    },
    call_discoverable_agent_tool: (args: { agent_tool_name: string; arguments?: string }) => {
      const name = args.agent_tool_name
      if (!DISCOVERABLE.has(name)) return record("call_discoverable_agent_tool", args, `Error: Unknown agent tool '${name}'. This tool is not available.`)
      if (!unlocked.has(name)) return record("call_discoverable_agent_tool", args, `Error: Tool '${name}' has not been unlocked. You must first use \`unlock_discoverable_agent_tool\` to unlock this tool before calling it.`)
      let parsed: BankingRecord
      try {
        const value: unknown = JSON.parse(args.arguments ?? "{}")
        if (value === null || typeof value !== "object" || Array.isArray(value)) return record("call_discoverable_agent_tool", args, "Error: Invalid arguments: arguments must decode to an object")
        parsed = value as BankingRecord
      } catch (error) { return record("call_discoverable_agent_tool", args, `Error: Invalid JSON in arguments: ${error instanceof Error ? error.message : error}`) }
      const allowed = new Set(TOOL_INFO[name]!.parameters.map(([parameter]) => parameter))
      const unexpected = Object.keys(parsed).find(key => !allowed.has(key))
      if (unexpected) return record("call_discoverable_agent_tool", { ...args, parsed_arguments: parsed }, `Error: Invalid arguments: unexpected keyword argument '${unexpected}'`)
      const result = specialized(name, parsed), mutated = MUTATING.has(name) && !result.startsWith("Error:")
      if ((mutated || readLogAllowlist.has(name)) && !result.startsWith("Error:")) table(db, "agent_discoverable_tools").data[hash(`agent_discoverable_tool:${name}`)] = { tool_name: name, status: "CALLED" }
      return record("call_discoverable_agent_tool", { ...args, parsed_arguments: parsed }, result, mutated)
    },
    list_discoverable_agent_tools: () => record("list_discoverable_agent_tools", {}, `Your called agent tools:\n${formatQuery(db, "agent_discoverable_tools", () => true)}`),
  }
  return tools
}
