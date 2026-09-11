import { system } from "tardie/agent"
import type { BankingEnvironment } from "../environment/banking.ts"
import { createBankingAgentContext, type ParticipantContext, type ParticipantFactory } from "./banking.ts"

export { createBankingAgentContext as createInterestAgentContext }
export type { ParticipantContext, ParticipantFactory }

export function createInterestAgent(version: string, environment: BankingEnvironment, taskId = "task_097") {
  const variant = version === "concise"
    ? system("Minimize redundant searches and repeated reads. Still complete verification, evidence review, separate consent, all corrections, and all reports. Keep customer-facing explanations brief and show the essential calculations.", { name: "interest-concise-instructions" })
    : version === "verify"
      ? system("After all credits and reports succeed, retrieve the accounts and transaction histories again. Confirm each correction appears and use the newly read balances in your final response.", { name: "interest-verification-instructions" })
      : system("Investigate every claimed discrepancy using retrieved documents and observed records. Complete every customer-authorized correction and report.", { name: "interest-baseline-instructions" })
  return createBankingAgentContext(environment, taskId).defineAgent(`interest-investigation-${version}`, [variant])
}
