import { defineActor } from "tardie/core"
import { agentMessageMethod, infer, outputValidateOnce, system } from "tardie/agent"

export type CustomerScenario = {
  opening: string
  persona: string
  privateFacts: readonly string[]
  objective: string
  stopConditions: readonly string[]
}

export type CustomerConsent = { openAccounts: boolean; transfers: boolean; closeAccounts: boolean; credits: boolean; reports: boolean }
export type CustomerReply = { text: string; consent: CustomerConsent; done: boolean }

export function parseCustomerReply(value: string): CustomerReply {
  const parsed = JSON.parse(value) as Partial<CustomerReply>
  const consent = parsed.consent
  if (typeof parsed.text !== "string" || typeof parsed.done !== "boolean" || !consent || [consent.openAccounts, consent.transfers, consent.closeAccounts, consent.credits, consent.reports].some(value => typeof value !== "boolean")) {
    throw new Error("customer model returned an invalid structured reply")
  }
  return { text: parsed.text.trim(), consent: consent!, done: parsed.done }
}

const customerInstructions = (scenario: CustomerScenario): string => `
You simulate one customer in a banking support conversation.

Persona:
${scenario.persona}

Private facts:
${scenario.privateFacts.map((fact) => `- ${fact}`).join("\n")}

Goal:
${scenario.objective}

Rules:
- Return exactly one JSON object with this shape: {"text":"natural customer reply","consent":{"openAccounts":false,"transfers":false,"closeAccounts":false,"credits":false,"reports":false},"done":false}.
- Set each consent field from your own intended reply: true only when the customer has explicitly authorized that category of action in this reply or an earlier reply. Never infer consent from the bank agent's words.
- Treat each incoming message as the bank agent's latest reply and respond to its meaning, even when it uses unexpected wording.
- Reveal private facts reactively. Give identity, account, balance, card, or consent details when the bank agent asks for them or when they are needed to unblock the goal. Do not dump every private fact at once.
- Give clear consent when the agent asks permission for an action that advances the goal.
- Keep pursuing unresolved parts of the goal. Correct misunderstandings using the private facts.
- Do not invent bank records, tool results, completed actions, policies, or facts outside this scenario.
- Never act as the bank agent and never claim that you performed a banking operation.
- Set done true only when every stop condition below is clearly satisfied; otherwise set it false.

Stop conditions:
${scenario.stopConditions.map((condition) => `- ${condition}`).join("\n")}
`.trim()

// createCustomerAgent creates a tool-free Tardie customer whose model is selected by the runner per message.
export function createCustomerAgent(scenario: CustomerScenario) {
  return defineActor(
    "mini-tau3-customer",
    { message: agentMessageMethod },
    [infer([system(customerInstructions(scenario)), outputValidateOnce])],
  )
}
