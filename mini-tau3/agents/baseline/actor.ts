import { defineActor } from "tardie/core"
import { agentMessageMethod, infer, outputValidateOnce } from "tardie/agent"
import { systemInstructions } from "./components/instructions.ts"
import { createBankToolBindings, type Bank } from "./components/bank-tools.ts"

export function createAgentContext(bank: Bank, taskId: string) {
  return { taskId, instructions: systemInstructions, tools: createBankToolBindings(bank), output: outputValidateOnce }
}
export type AgentContext = ReturnType<typeof createAgentContext>

export function createAgent(context: AgentContext) {
  return defineActor("baseline", { message: agentMessageMethod }, [
    infer([context.instructions, context.tools, context.output]),
  ])
}
export type AgentFactory = (context: AgentContext) => ReturnType<typeof createAgent>

export function createBaselineAgent(bank: Bank, taskId: string) {
  return createAgent(createAgentContext(bank, taskId))
}
