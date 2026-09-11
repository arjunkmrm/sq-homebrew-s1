import { Effect } from "effect"
import { defineActor } from "tardie/core"
import { agentMessageMethod, infer, outputValidateOnce, system, tool } from "tardie/agent"
import type { BankingEnvironment } from "../environment/banking.ts"

const bankingInstructionText = `You are a Rho-Bank support agent. Conduct a natural conversation and use the supplied canonical tau banking tools.
Identity lookup is part of verification. Verify identity before accessing account information or changing money. Search and retrieve primary policy documents instead of guessing. The corpus may mention discoverable tools: unlock them before invoking them through call_discoverable_agent_tool, and pass that tool's arguments as a JSON string.
Never invent account IDs, balances, policies, tool results, or successful actions. Explain material findings and ask for customer consent before consequential changes. If a tool returns an error, do not claim success. When you need information or consent, ask the customer and stop so they can answer on the next turn.`
export const bankingInstructions = system(bankingInstructionText)

const safe = (operation: () => unknown) => { try { return operation() } catch (error) { return `Error: ${error instanceof Error ? error.message : String(error)}` } }

export function createBankingToolBindings(environment: BankingEnvironment) {
  const definitions: any[] = [
    ["search_documents", "Search the complete Rho-Bank knowledge corpus.", { query: { type: "string" }, limit: { type: "integer", minimum: 1, maximum: 20 } }, ["query"], (x: any) => environment.tools.search_documents(x)],
    ["get_document", "Retrieve a complete policy document returned by search.", { documentId: { type: "string" } }, ["documentId"], (x: any) => environment.tools.get_document(x)],
    ["get_current_time", "Get the current bank-system time for verification records.", {}, [], () => environment.tools.get_current_time()],
    ["get_user_information_by_id", "Find a customer by user ID.", { user_id: { type: "string" } }, ["user_id"], (x: any) => environment.tools.get_user_information_by_id(x)],
    ["get_user_information_by_name", "Find a customer by full name.", { customer_name: { type: "string" } }, ["customer_name"], (x: any) => environment.tools.get_user_information_by_name(x)],
    ["get_user_information_by_email", "Find a customer by email address.", { email: { type: "string" } }, ["email"], (x: any) => environment.tools.get_user_information_by_email(x)],
    ["log_verification", "Record successful identity verification using the exact customer record and current time.", { name: { type: "string" }, user_id: { type: "string" }, address: { type: "string" }, email: { type: "string" }, phone_number: { type: "string" }, date_of_birth: { type: "string" }, time_verified: { type: "string" } }, ["name", "user_id", "address", "email", "phone_number", "date_of_birth", "time_verified"], (x: any) => environment.tools.log_verification(x)],
    ["unlock_discoverable_agent_tool", "Unlock one specialized tool named by an internal policy document.", { agent_tool_name: { type: "string" } }, ["agent_tool_name"], (x: any) => environment.tools.unlock_discoverable_agent_tool(x)],
    ["call_discoverable_agent_tool", "Call an unlocked specialized tool. Encode its arguments as a JSON object string.", { agent_tool_name: { type: "string" }, arguments: { type: "string" } }, ["agent_tool_name", "arguments"], (x: any) => environment.tools.call_discoverable_agent_tool(x)],
  ]
  return tool(definitions.map(([name, description, properties, required, run]) => ({
    spec: { name, description, inputSchema: { type: "object", properties, required, additionalProperties: false } },
    run: (input: unknown) => Effect.sync(() => safe(() => run(input))),
  })))
}

export function createBankingAgentContext(environment: BankingEnvironment, taskId: string) {
  const tools = createBankingToolBindings(environment)
  const output = outputValidateOnce
  const instructions = bankingInstructions
  return {
    taskId, instructions, tools, output,
    defineAgent(name: string, additionalInstructions: ReturnType<typeof system>[] = []) {
      if (!/^[a-z0-9][a-z0-9-]{0,62}$/.test(name)) throw new Error("agent name must use lowercase letters, numbers, and hyphens")
      return defineActor(name, { message: agentMessageMethod }, [infer([instructions, ...additionalInstructions, tools, output])])
    },
  }
}

export type ParticipantContext = ReturnType<typeof createBankingAgentContext>
export type ParticipantFactory = (context: ParticipantContext) => ReturnType<ParticipantContext["defineAgent"]>
