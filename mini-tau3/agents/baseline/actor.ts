import { defineActor } from "../../../../tardigrade/packages/tardie/src/core.ts"
import { agentMessageMethod, infer, outputValidateOnce } from "../../../../tardigrade/packages/tardie/src/agent.ts"
import { createBankToolBindings, type Bank } from "./components/bank-tools.ts"
import { systemInstructions } from "./components/instructions.ts"

export function createBaselineAgent(bank: Bank, customerId: string) {
  return defineActor(
    "mini-tau3-baseline",
    { message: agentMessageMethod },
    [infer([systemInstructions, createBankToolBindings(bank, customerId), outputValidateOnce])],
  )
}
