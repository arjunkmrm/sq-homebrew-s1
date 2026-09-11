import { createBaselineAgent } from "./baseline/actor.ts"
import { system } from "tardie/agent"
import type { BankingEnvironment } from "../environment/banking.ts"
import type { AgentVersion } from "./variant-info.ts"
import { createBankingAgentContext } from "./banking.ts"

export function createAgentVersion(version: AgentVersion, environment: BankingEnvironment, taskId: string) {
  if (version === "baseline") return createBaselineAgent(environment, taskId)
  const instruction = version === "concise"
    ? system("Minimize redundant tool calls and keep the final answer concise without skipping policy requirements.", { name: "concise-variant" })
    : version === "verify"
      ? system("After a transfer, retrieve the customer's accounts again and confirm the resulting balances before answering.", { name: "verify-variant" })
      : system("Complete the customer's request safely and accurately.", { name: "baseline-variant" })
  return createBankingAgentContext(environment, taskId).defineAgent(`banking-${version}`, [instruction])
}
