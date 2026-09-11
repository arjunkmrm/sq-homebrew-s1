export const agentVariants = [
  { id: "baseline", label: "Baseline", description: "Follow the banking policy and use the available tools." },
  { id: "concise", label: "Concise", description: "Avoid redundant calls and give a brief answer after completing the task safely." },
  { id: "verify", label: "Verify", description: "Read both final account balances after a transfer before answering." },
] as const

export type AgentVersion = typeof agentVariants[number]["id"]

export const isAgentVersion = (value: string): value is AgentVersion =>
  agentVariants.some(variant => variant.id === value)
