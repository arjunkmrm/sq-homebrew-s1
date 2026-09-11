import baseDb from "../environment/base-db.json"
import task056 from "./task_056.json"
import task060 from "./task_060.json"
import task062 from "./task_062.json"
import task072 from "./task_072.json"
import task074 from "./task_074.json"
import task093 from "./task_093.json"
import task094 from "./task_094.json"
import task095 from "./task_095.json"
import task096 from "./task_096.json"
import task097 from "./task_097.json"
import type { BankingEnvironment, BankingRecord, BankingSeed } from "../environment/banking.ts"

export const bankingTaskIds = ["task_056", "task_060", "task_062", "task_072", "task_074", "task_093", "task_094", "task_095", "task_096", "task_097"] as const
export type BankingTaskId = typeof bankingTaskIds[number]
export type BankingAction = { name: string; arguments: BankingRecord; requestor: "assistant" | "user"; action_id: string }
export type BankingTask = {
  id: BankingTaskId
  description: { purpose: string; relevant_policies: unknown; notes: string | null }
  user_scenario: { persona: unknown; instructions: string }
  initial_state: { initialization_data: { agent_data?: Record<string, { data?: Record<string, BankingRecord>; notes?: string }> | null } | null } | null
  evaluation_criteria: { actions: BankingAction[]; reward_basis: string[] }
  annotations: unknown
  user_tools: string[]
  required_documents: string[]
}

const taskMap = { task_056: task056, task_060: task060, task_062: task062, task_072: task072, task_074: task074, task_093: task093, task_094: task094, task_095: task095, task_096: task096, task_097: task097 } as unknown as Record<BankingTaskId, BankingTask>
export const bankingTasks = bankingTaskIds.map(id => taskMap[id])
export const loadBankingTask = (id: BankingTaskId): BankingTask => structuredClone(taskMap[id])
export const getRequiredReadLogAllowlist = (task: BankingTask): string[] => [...new Set(task.evaluation_criteria.actions.flatMap(action => {
  if (action.name !== "call_discoverable_agent_tool") return []
  const name = action.arguments.agent_tool_name
  return name === "get_all_user_accounts_by_user_id_3847" || name === "get_bank_account_transactions_9173" ? [name] : []
}))]

export function createBankingTaskSeed(task: BankingTask): BankingSeed {
  const seed = structuredClone(baseDb) as BankingSeed
  const updates = task.initial_state?.initialization_data?.agent_data ?? {}
  for (const [name, update] of Object.entries(updates)) {
    const target = seed[name] ??= { data: {}, notes: "" }
    if (update.notes !== undefined) target.notes = update.notes
    Object.assign(target.data, structuredClone(update.data ?? {}))
  }
  return seed
}

export function executeGoldAssistantAction(environment: BankingEnvironment, action: BankingAction): string | unknown {
  if (action.requestor !== "assistant") throw new Error(`Action ${action.action_id} belongs to the user participant.`)
  const callable = environment.tools[action.name as keyof typeof environment.tools] as ((args: BankingRecord) => unknown) | undefined
  if (!callable) throw new Error(`Unsupported upstream tool ${action.name}.`)
  return callable(structuredClone(action.arguments))
}

export const bankingProvenance = {
  repository: "https://github.com/sierra-research/tau2-bench",
  commit: "2174a603f6d014ef94473ffa95957f6ce27100db",
  retrieved: "2026-09-11",
  taskPath: "data/tau2/domains/banking_knowledge/tasks",
  databasePath: "data/tau2/domains/banking_knowledge/db.json",
} as const
