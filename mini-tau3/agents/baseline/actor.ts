import type { ParticipantFactory } from "../banking.ts"
import { defineActor } from "tardie/core"
import { agentMessageMethod, infer, outputValidateOnce } from "tardie/agent"
import { systemInstructions } from "./components/instructions.ts"
import { createBankToolBindings, type Bank } from "./components/bank-tools.ts"

function baseline(tools: ReturnType<typeof createBankToolBindings>) {
  return defineActor("mini-tau3-baseline", { message: agentMessageMethod }, [
    infer([systemInstructions, tools, outputValidateOnce]),
  ])
}

export const createAgent: ParticipantFactory = (context) => baseline(context.tools)

export function createBaselineAgent(bank: Bank, _taskId: string) {
  return baseline(createBankToolBindings(bank))
}
