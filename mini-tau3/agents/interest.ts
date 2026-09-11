import { Effect } from "effect"
import { defineActor } from "tardie/core"
import { agentMessageMethod, infer, outputValidateOnce, system, tool } from "tardie/agent"
import type { InterestEnvironment } from "../environment/interest.ts"

const instructions = system(`You are the Rho-Bank support agent in a workshop adaptation of a tau3 banking task. Conduct a natural multi-turn conversation.
Before accessing customer data, ask the customer for all identity fields required by verify_customer and call it. Investigate claims using account and transaction tools. Search and retrieve policy documents; calculate APYs and monthly discrepancies yourself from those documents and observed state. Do not trust remembered balances or expected payments.
Checking bonuses do not stack with each other; card bonuses do not stack with each other. Do not apply a credit until you have explained your calculations and received explicit consent from the customer. Do not submit discrepancy reports until you separately mention them and receive explicit consent. Apply the relevant credit before its report. Money tool inputs use integer cents. If a tool rejects an operation, do not claim success.
The knowledge documents are original tau-bench documents. This local environment exposes equivalent tools directly, without discovery/unlock wrappers:
- log_verification → verify_customer (use the five identity fields in the local schema).
- get_all_user_accounts_by_user_id_3847 → get_all_accounts.
- get_bank_account_transactions_9173 → get_transactions.
- apply_savings_account_credit_6831 → apply_credit.
- submit_interest_discrepancy_report_7294 → submit_report.
Use the local tool schemas for argument names. Convert document amounts in dollars into integer cents for money arguments. Other banking workflows mentioned in the corpus are outside this task's available tools.
When you need information or consent, ask the customer in your response and stop so they can answer on the next turn. Once all requested work is complete, clearly confirm the credits, reports, corrected APYs, and new balances.`)

const safe = (operation: () => unknown) => { try { return operation() } catch (error) { return { error: error instanceof Error ? error.message : String(error) } } }

function bindings(env: InterestEnvironment) {
  const defs: any[] = [
    ["search_documents", "Search the bank knowledge base. Retrieve matching documents with get_document before relying on details.", { query: { type: "string" }, limit: { type: "integer", minimum: 1, maximum: 20 } }, ["query"], (x: any) => env.searchDocuments(x)],
    ["get_document", "Retrieve one complete bank policy document by ID.", { documentId: { type: "string" } }, ["documentId"], (x: any) => env.getDocument(x)],
    ["verify_customer", "Verify the customer using all five identity fields.", { name: { type: "string" }, phone: { type: "string" }, email: { type: "string" }, dateOfBirth: { type: "string" }, address: { type: "string" } }, ["name", "phone", "email", "dateOfBirth", "address"], (x: any) => env.verifyCustomer(x)],
    ["get_all_accounts", "Retrieve all bank and credit-card accounts for a verified customer.", { userId: { type: "string" } }, ["userId"], (x: any) => env.getAllAccounts(x)],
    ["get_transactions", "Retrieve an owned bank account's transaction history.", { accountId: { type: "string" } }, ["accountId"], (x: any) => env.getTransactions(x)],
    ["apply_credit", "Apply a positive whole-cent savings interest correction after explicit consent.", { accountId: { type: "string" }, amountCents: { type: "integer", minimum: 1 }, creditType: { type: "string", enum: ["interest_correction"] } }, ["accountId", "amountCents", "creditType"], (x: any) => env.applyCredit(x)],
    ["submit_report", "Submit an interest discrepancy report after its credit and explicit report consent.", { accountId: { type: "string" }, userId: { type: "string" }, expectedApy: { type: "number" }, actualApy: { type: "number" }, amountDifferenceCents: { type: "integer", minimum: 1 } }, ["accountId", "userId", "expectedApy", "actualApy", "amountDifferenceCents"], (x: any) => env.submitReport(x)],
  ]
  return tool(defs.map(([name, description, properties, required, run]) => ({
    spec: { name, description, inputSchema: { type: "object", properties, required, additionalProperties: false } },
    run: (input: unknown) => Effect.sync(() => safe(() => run(input))),
  })))
}

export function createInterestAgent(version: string, environment: InterestEnvironment) {
  const variant = version === "concise"
    ? system("Minimize redundant searches and repeated reads. Still complete verification, evidence review, separate consent, all corrections, and all reports. Keep customer-facing explanations brief and show the essential calculations.", { name: "interest-concise-instructions" })
    : version === "verify"
      ? system("After all credits and reports succeed, call get_all_accounts again and call get_transactions for each of the four savings accounts. Confirm each correction appears in transaction history and use the newly read balances in your final response.", { name: "interest-verification-instructions" })
      : undefined
  const components = variant
    ? [instructions, variant, bindings(environment), outputValidateOnce]
    : [instructions, bindings(environment), outputValidateOnce]
  return defineActor(`interest-investigation-${version}`, { message: agentMessageMethod }, [infer(components)])
}
