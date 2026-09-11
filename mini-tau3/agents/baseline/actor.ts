import { defineActor } from "tardie/core"
import { agentMessageMethod, infer, outputValidateOnce } from "tardie/agent"
import { systemInstructions } from "./components/instructions.ts"
import { createBankToolBindings, type Bank } from "./components/bank-tools.ts"

export function createBaselineAgent(bank: Bank, _taskId: string) {
  return defineActor("mini-tau3-baseline", { message: agentMessageMethod }, [
    infer([systemInstructions, createBankToolBindings(bank), outputValidateOnce]),
  ])
}
