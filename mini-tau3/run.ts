import { mkdir, writeFile } from "node:fs/promises"
import { basename, isAbsolute, join, resolve } from "node:path"
import { pathToFileURL } from "node:url"
import { modelAdapters } from "tardie/model/adapter"
import { openAICompatibleAdapter } from "tardie/model/openai"
import { bedrockAdapterForBun } from "tardie/model/bedrock"
import { bunModelServices } from "tardie/server/model-services"
import { createBunHost, hostBackend } from "tardie/bun/create-host"
import { createAgentVersion } from "./agents/versions.ts"
import { isAgentVersion, type AgentVersion } from "./agents/variant-info.ts"
import { createBankingEnvironment } from "./environment/banking.ts"
import type { CaseRun, ModelRef } from "./types.ts"
import type { Event } from "tardie/core/event"
import { replayProjection } from "tardie/core/projection"
import { trajectoryProjection } from "./rewards/trajectory.ts"
import { createInterestAgent, createInterestAgentContext, type ParticipantFactory } from "./agents/interest.ts"
import { createCustomerAgent, parseCustomerReply } from "./customer/agent.ts"
import { evaluateInterestState } from "./rewards/interest-run.ts"
import { scoreBankingRun } from "./rewards/banking-run.ts"
import { createBankingTaskSeed, getRequiredReadLogAllowlist, loadBankingTask, bankingTaskIds, type BankingTaskId } from "./tasks/index.ts"

type Options = {
  agentVersion: AgentVersion
  agentFile?: string
  agentModel: ModelRef
  customerModel: ModelRef
  cases: string[]
  output: string
  dryRun: boolean
  timeoutMs: number
  listTasks: boolean
}

const modelRef = (value: string): ModelRef => {
  const split = value.indexOf(":")
  if (split < 1 || split === value.length - 1) throw new Error(`model must be provider:model, got ${JSON.stringify(value)}`)
  return { provider: value.slice(0, split), model_id: value.slice(split + 1) }
}

export function parseArgs(args: string[]): Options {
  const values = new Map<string, string>()
  let dryRun = false
  let listTasks = false
  const allowed = new Set(["--agent-model", "--customer-model", "--agent-version", "--agent-file", "--cases", "--output", "--timeout-ms"])
  for (let index = 0; index < args.length; index++) {
    const arg = args[index]!
    if (arg === "--dry-run") { dryRun = true; continue }
    if (arg === "--list-tasks") { listTasks = true; continue }
    if (!allowed.has(arg)) throw new Error(`unknown option ${arg}`)
    const value = args[++index]
    if (!arg.startsWith("--") || value === undefined) throw new Error(`missing value for ${arg}`)
    values.set(arg, value)
  }
  const agent = values.get("--agent-model") ?? process.env.TAU3_AGENT_MODEL
  const customer = values.get("--customer-model") ?? process.env.TAU3_CUSTOMER_MODEL ?? agent
  if (!listTasks && (!agent || !customer)) throw new Error("set agent and customer models as provider:model")
  const timeoutMs = Number(values.get("--timeout-ms") ?? process.env.TAU3_TIMEOUT_MS ?? 120_000)
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs <= 0) throw new Error("--timeout-ms must be a positive integer")
  const agentVersion = values.get("--agent-version") ?? "baseline"
  if (!isAgentVersion(agentVersion)) throw new Error(`unknown agent version ${JSON.stringify(agentVersion)}`)
  return {
    agentVersion,
    agentFile: values.get("--agent-file"),
    agentModel: modelRef(agent ?? "offline:unused"),
    customerModel: modelRef(customer ?? "offline:unused"),
    cases: (values.get("--cases") ?? "").split(",").filter(Boolean),
    output: values.get("--output") ?? join("runs", new Date().toISOString().replaceAll(":", "-")),
    dryRun,
    timeoutMs,
    listTasks,
  }
}

const providerConfig = (provider: string) => {
  const upper = provider.replace(/[^a-z0-9]/gi, "_").toUpperCase()
  const baseUrl = process.env[`TAU3_${upper}_BASE_URL`] ?? ({
    openai: "https://api.openai.com/v1",
    openrouter: "https://openrouter.ai/api/v1",
  } as Record<string, string>)[provider]
  const configuredCredential = process.env[`TAU3_${upper}_API_KEY_ENV`] ?? ({
    openai: "OPENAI_API_KEY",
    openrouter: "OPENROUTER_API_KEY",
  } as Record<string, string>)[provider]
  const credential = configuredCredential === "MODEL_API_KEY" ? "TAU3_GATEWAY_KEY" : configuredCredential
  if (!baseUrl || !credential) throw new Error(`configure TAU3_${upper}_BASE_URL and TAU3_${upper}_API_KEY_ENV`)
  return { baseUrl, protocol: (provider === "bedrock" || provider === "amazon-bedrock") ? "bedrock-converse" : provider === "openai" ? "openai-responses" : "openai-chat-completions", env: [credential], ...((provider === "bedrock" || provider === "amazon-bedrock") ? { region: process.env.TAU3_BEDROCK_REGION ?? "us-east-1" } : {}) }
}

function runtimeEnv(options: Options): Record<string, string | undefined> {
  const models = [options.agentModel, options.customerModel]
  const providers = Object.fromEntries([...new Set(models.map(({ provider }) => provider))].map((provider) => [provider, providerConfig(provider)]))
  const env: Record<string, string | undefined> = {
    ...process.env,
    TARDIGRADE_MODEL_CATALOG_LOAD_POLICY: process.env.TARDIGRADE_MODEL_CATALOG_LOAD_POLICY ?? "cache-first",
    TARDIGRADE_CONFIG: JSON.stringify({ models: { default: options.agentModel, allow: "*", providers } }),
  }
  if (!env.TAU3_GATEWAY_KEY && process.env.MODEL_API_KEY) env.TAU3_GATEWAY_KEY = process.env.MODEL_API_KEY
  for (const key of ["MODEL_BASE_URL", "MODEL_API_KEY", "MODEL_ID", "MODEL_PROVIDER"]) delete env[key]
  return env
}

const errorMessage = (error: unknown) => error instanceof Error ? error.message : String(error)
const STREAM_PREFIX = "__TAU3_STREAM__"
const streamPacket = (packet: unknown) => {
  if (process.env.TAU3_STREAM_EVENTS === "1") console.log(`${STREAM_PREFIX}${JSON.stringify(packet)}`)
}

const participantName = (file: string) => basename(file).replace(/\.[^.]+$/, "")
const bankingStateChecks = (task: ReturnType<typeof loadBankingTask>, run: Pick<CaseRun, "id" | "events" | "stateBefore" | "stateAfter" | "audit" | "customerTurns" | "status" | "error">) => {
  if (task.id === "task_097") return evaluateInterestState(run.stateBefore, run.stateAfter, { audit: run.audit, customerTurns: run.customerTurns })
  const score = scoreBankingRun(task, run)
  return { pass: score.completed, checks: score.checks }
}

async function loadParticipant(file: string, environment: ReturnType<typeof createBankingEnvironment>, taskId: string) {
  const absolute = isAbsolute(file) ? file : resolve(process.cwd(), file)
  const module = await import(pathToFileURL(absolute).href) as { createAgent?: ParticipantFactory }
  if (typeof module.createAgent !== "function") throw new Error("agent file must export a createAgent(context) function")
  return module.createAgent(createInterestAgentContext(environment, taskId))
}

async function main() {
  const options = parseArgs(Bun.argv.slice(2))
  if (options.listTasks) {
    console.log(JSON.stringify({ tasks: bankingTaskIds }, null, 2))
    return
  }
  const bankingQueries = bankingTaskIds.map(id => ({ id, customerId: "", initialState: `banking/${id}`, request: loadBankingTask(id).description.purpose }))
  const available = bankingQueries
  const requestedCases = options.cases.includes("all") ? [...bankingTaskIds] : options.cases
  const selected = requestedCases.length === 0 ? bankingQueries : available.filter(({ id }) => requestedCases.includes(id))
  const unknown = requestedCases.filter((id) => !available.some((query) => query.id === id))
  if (unknown.length > 0) throw new Error(`unknown cases: ${unknown.join(", ")}`)
  if (selected.length === 0) throw new Error("no cases selected")

  if (options.dryRun) {
    console.log(JSON.stringify({ valid: true, cases: selected.map(({ id }) => id), agentVersion: options.agentFile ? participantName(options.agentFile) : options.agentVersion, agentModel: options.agentModel, customerModel: options.customerModel }, null, 2))
    return
  }

  await mkdir(options.output, { recursive: true })
  const adapters = [openAICompatibleAdapter]
  if ([options.agentModel, options.customerModel].some(model => model.provider === "bedrock" || model.provider === "amazon-bedrock")) adapters.push(await bedrockAdapterForBun())
  const env = runtimeEnv(options)
  const configFile = join(options.output, "runtime-config.json")
  await writeFile(configFile, JSON.stringify({ vars: { TARDIGRADE_CONFIG: JSON.parse(env.TARDIGRADE_CONFIG!) } }, null, 2))
  const { layers } = await bunModelServices({ env, configFile, adapters: modelAdapters(...adapters) })
  const results: CaseRun[] = []

  for (const query of selected) {
  const startedAt = new Date().toISOString()
  const bankingTask = loadBankingTask(query.id as BankingTaskId)
  const environment = createBankingEnvironment(createBankingTaskSeed(bankingTask), { readLogAllowlist: getRequiredReadLogAllowlist(bankingTask) })
  const stateBefore = environment.snapshot()
  const customerScenario = {
    opening: "",
    persona: bankingTask.user_scenario.instructions,
    privateFacts: [],
    objective: "Follow the private scenario faithfully and complete the requested banking interaction.",
    stopConditions: ["The scenario's requested outcome is complete or the bank agent cannot make further progress."],
  }
  const customerTurns: CaseRun["customerTurns"] = []
  const events: Event[] = []
  const customerEvents: Event[] = []
  let finalAnswer: string | undefined
  const agentVersion = options.agentFile ? participantName(options.agentFile) : options.agentVersion
  let run: CaseRun
  try {
    const actor = options.agentFile ? await loadParticipant(options.agentFile, environment, query.id) : query.id === "task_097" ? createInterestAgent(options.agentVersion, environment, query.id) : createAgentVersion(options.agentVersion, environment, query.id)
    const host = await createBunHost({ actor, storage: ":memory:", layersFor: () => layers })
    const customerHost = await createBunHost({ actor: createCustomerAgent(customerScenario), storage: ":memory:", layersFor: () => layers })
    let polling = true
    const thread = await host.allocateRootThread({ instance: query.id, name: "main" })
    const customerThread = await customerHost.allocateRootThread({ instance: `${query.id}-customer`, name: "main" })
    const syncEvents = async () => {
      const stored = await hostBackend(host).instances.get(query.id)!.read(thread.coordinate.thread)
      for (const event of stored.slice(events.length)) {
        events.push(event)
        streamPacket({ kind: "event", event })
      }
    }
    const poller = (async () => {
      while (polling) { await syncEvents(); await Bun.sleep(100) }
      await syncEvents()
    })()
    const deadline = Date.now() + options.timeoutMs
    let customerText: string | null = customerScenario.opening
    if (!customerText) {
      const opening = parseCustomerReply(await customerThread.methods.message({ text: "Begin the conversation with the bank support agent.", model: options.customerModel }, { key: "opening", timeoutMs: Math.max(1, deadline - Date.now()) }))
      customerText = opening.text
      customerTurns.push({ text: opening.text, afterToolSeq: 0, consent: opening.consent })
    } else customerTurns.push({ text: customerText, afterToolSeq: 0, consent: { openAccounts: false, transfers: false, closeAccounts: false, credits: false, reports: false } })
    streamPacket({ kind: "status", message: "Running multi-turn banking task…" })
    try {
      for (let turn = 0; customerText !== null && turn < 15; turn++) {
        const remaining = deadline - Date.now()
        if (remaining <= 0) throw new Error("banking task exceeded its total deadline")
        finalAnswer = await thread.methods.message(
          { text: customerText, model: options.agentModel },
          { key: `request-${turn}`, timeoutMs: Math.min(options.timeoutMs, remaining) },
        )
        const response = await customerThread.methods.message(
          { text: finalAnswer, model: options.customerModel },
          { key: `response-${turn}`, timeoutMs: Math.min(options.timeoutMs, Math.max(1, deadline - Date.now())) },
        )
        const customerReply = parseCustomerReply(response)
        if (customerReply.text) {
          const afterToolSeq = environment.auditSnapshot().at(-1)?.seq ?? 0
          customerTurns.push({ text: customerReply.text, afterToolSeq, consent: customerReply.consent })
        }
        customerText = customerReply.done ? null : customerReply.text
      }
      if (customerText !== null) throw new Error("banking task exceeded its turn limit")
    } finally {
      polling = false
      try { await poller } finally {
        const storedCustomerEvents = await hostBackend(customerHost).instances.get(`${query.id}-customer`)!.read(customerThread.coordinate.thread)
        customerEvents.push(...storedCustomerEvents)
        await Promise.allSettled([host.close(), customerHost.close()])
      }
    }
    const stateAfter = environment.snapshot()
    const audit = environment.auditSnapshot()
    const partial = { id: query.id, events, stateBefore, stateAfter, audit, customerTurns, status: "judged" as const }
    run = {
      id: query.id, agentVersion, request: customerTurns[0]?.text ?? customerScenario.opening, status: "judged", finalAnswer,
      events, trajectory: replayProjection(trajectoryProjection, events), stateBefore, stateAfter,
      stateChecks: bankingStateChecks(bankingTask, partial), audit, customerTurns, customerEvents, startedAt, finishedAt: new Date().toISOString(),
    } as unknown as CaseRun
  } catch (error) {
    const stateAfter = environment.snapshot()
    const audit = environment.auditSnapshot()
    const runError = { stage: "agent" as const, message: errorMessage(error) }
    const partial = { id: query.id, events, stateBefore, stateAfter, audit, customerTurns, status: "error" as const, error: runError }
    run = {
      id: query.id, agentVersion, request: customerTurns[0]?.text ?? customerScenario.opening, status: "error",
      error: runError, events, trajectory: replayProjection(trajectoryProjection, events),
      stateBefore, stateAfter, stateChecks: bankingStateChecks(bankingTask, partial), audit, customerTurns, customerEvents, startedAt, finishedAt: new Date().toISOString(),
    } as unknown as CaseRun
  }
  results.push(run)
  await writeFile(join(options.output, `${query.id}.json`), JSON.stringify(run, null, 2) + "\n")

  }

  const passed = (run: CaseRun) => run.status === "judged" && run.stateChecks.pass
  const summary = {
    generatedAt: new Date().toISOString(),
    agentVersion: options.agentVersion,
    agentModel: options.agentModel,
    customerModel: options.customerModel,
    counts: {
      total: results.length,
      passed: results.filter(passed).length,
      failed: results.filter((run) => run.status === "judged" && !passed(run)).length,
      errors: results.filter((run) => run.status === "error").length,
      statePassed: results.filter((run) => run.stateChecks.pass).length,
    },
    cases: results,
  }
  await writeFile(join(options.output, "summary.json"), JSON.stringify(summary, null, 2) + "\n")
  console.log(JSON.stringify({ output: options.output, ...summary.counts }, null, 2))
}

if (import.meta.main) await main()
