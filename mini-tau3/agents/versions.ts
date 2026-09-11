import { defineActor } from "tardie/core"
import { agentMessageMethod, infer, outputValidateOnce, system } from "tardie/agent"
import { createBaselineAgent } from "./baseline/actor.ts"
import { createBankToolBindings, type Bank } from "./baseline/components/bank-tools.ts"
import { systemInstructions } from "./baseline/components/instructions.ts"
import type { AgentVersion } from "./variant-info.ts"

const variantInstruction = {
  concise: system("Minimize redundant tool calls. After safely following every bank policy requirement, answer concisely. Never skip a required inspection or policy check for brevity.", { name: "concise-instructions" }),
  verify: system("After a successful transfer, call get_account for both the source and destination accounts to verify their final balances before answering. Report the verified balances.", { name: "verification-instructions" }),
}

const createVariantAgent = (version: "concise" | "verify", bank: Bank, customerId: string) =>
  defineActor(
    `mini-tau3-${version}`,
    { message: agentMessageMethod },
    [infer([systemInstructions, variantInstruction[version], createBankToolBindings(bank, customerId), outputValidateOnce])],
  )

export function createAgentVersion(version: AgentVersion, bank: Bank, customerId: string) {
  if (version === "baseline") return createBaselineAgent(bank, customerId)
  return createVariantAgent(version, bank, customerId)
}
