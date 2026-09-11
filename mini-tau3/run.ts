import { mkdir, readFile, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { modelAdapters } from "tardie/model/adapter"
import { openAICompatibleAdapter } from "tardie/model/openai"
import { bedrockAdapterForBun } from "tardie/model/bedrock"
import { bunModelServices } from "tardie/server/model-services"
import { createBunHost, hostBackend } from "tardie/bun/create-host"
import { createAgentVersion } from "./agents/versions.ts"
import { isAgentVersion, type AgentVersion } from "./agents/variant-info.ts"
import { createBankState, loadSeedState } from "./environment/bank/state.ts"
import { judgeActor, judgePrompt, parseJudgment } from "./evals/judge.ts"
import { evaluateState } from "./evals/state-checks.ts"
import type { CaseRun, ModelRef, Query } from "./types.ts"
import type { Event } from "tardie/core/event"
import { replayProjection } from "tardie/core/projection"
import { trajectoryProjection } from "./rewards/trajectory.ts"
import { createInterestAgent } from "./agents/interest.ts"
import { createInterestEnvironment } from "./environment/interest.ts"
import { createInterestCustomer } from "./customer/interest.ts"
import { interestSeed } from "./tasks/interest-investigation/seed.ts"
import { interestScenario } from "./tasks/interest-investigation/scenario.ts"
import { evaluateInterestState } from "./rewards/interest-run.ts"

type Options = {
  agentVersion: AgentVersion
  agentModel: ModelRef
  judgeModel: ModelRef
  cases: string[]
  output: string
  dryRun: boolean
  timeoutMs: number
}

const modelRef = (value: string): ModelRef => {
  const split = value.indexOf(":")
  if (split < 1 || split === value.length - 1) throw new Error(`model must be provider:model, got ${JSON.stringify(value)}`)
  return { provider: value.slice(0, split), model_id: value.slice(split + 1) }
}

export function parseArgs(args: string[]): Options {
  const values = new Map<string, string>()
  let dryRun = false
  const allowed = new Set(["--agent-model", "--judge-model", "--agent-version", "--cases", "--output", "--timeout-ms"])
  for (let index = 0; index < args.length; index++) {
    const arg = args[index]!
    if (arg === "--dry-run") { dryRun = true; continue }
    if (!allowed.has(arg)) throw new Error(`unknown option ${arg}`)
    const value = args[++index]
    if (!arg.startsWith("--") || value === undefined) throw new Error(`missing value for ${arg}`)
    values.set(arg, value)
  }
  const agent = values.get("--agent-model") ?? process.env.TAU3_AGENT_MODEL
  const judge = values.get("--judge-model") ?? process.env.TAU3_JUDGE_MODEL ?? agent
  if (!agent || !judge) throw new Error("set --agent-model and --judge-model as provider:model")
  const timeoutMs = Number(values.get("--timeout-ms") ?? process.env.TAU3_TIMEOUT_MS ?? 120_000)
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs <= 0) throw new Error("--timeout-ms must be a positive integer")
  const agentVersion = values.get("--agent-version") ?? "baseline"
  if (!isAgentVersion(agentVersion)) throw new Error(`unknown agent version ${JSON.stringify(agentVersion)}`)
  return {
    agentVersion,
    agentModel: modelRef(agent),
    judgeModel: modelRef(judge),
    cases: (values.get("--cases") ?? "").split(",").filter(Boolean),
    output: values.get("--output") ?? join("runs", new Date().toISOString().replaceAll(":", "-")),
    dryRun,
    timeoutMs,
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
  const models = [options.agentModel, options.judgeModel]
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

async function main() {
  const options = parseArgs(Bun.argv.slice(2))
  const queries = JSON.parse(await readFile(new URL("./tasks/queries.json", import.meta.url), "utf8")) as Query[]
  const expectedAnswers = JSON.parse(await readFile(new URL("./evals/expected-answers.json", import.meta.url), "utf8")) as Record<string, string>
  const interestQuery: Query = { id: "task_097", customerId: "mc80w7k3x9", initialState: "interest-investigation", request: "Investigate and correct the interest discrepancies on all four savings accounts." }
  const available = [...queries, interestQuery]
  const selected = options.cases.length === 0 ? queries : available.filter(({ id }) => options.cases.includes(id))
  const unknown = options.cases.filter((id) => !available.some((query) => query.id === id))
  if (unknown.length > 0) throw new Error(`unknown cases: ${unknown.join(", ")}`)
  if (selected.length === 0) throw new Error("no cases selected")

  if (options.dryRun) {
    console.log(JSON.stringify({ valid: true, cases: selected.map(({ id }) => id), agentVersion: options.agentVersion, agentModel: options.agentModel, judgeModel: options.judgeModel }, null, 2))
    return
  }

  await mkdir(options.output, { recursive: true })
  const adapters = [openAICompatibleAdapter]
  if ([options.agentModel, options.judgeModel].some(model => model.provider === "bedrock" || model.provider === "amazon-bedrock")) adapters.push(await bedrockAdapterForBun())
  const env = runtimeEnv(options)
  const configFile = join(options.output, "runtime-config.json")
  await writeFile(configFile, JSON.stringify({ vars: { TARDIGRADE_CONFIG: JSON.parse(env.TARDIGRADE_CONFIG!) } }, null, 2))
  const { layers } = await bunModelServices({ env, configFile, adapters: modelAdapters(...adapters) })
  const results: CaseRun[] = []

  for (const query of selected) {
    if (query.id === "task_097") {
      const startedAt = new Date().toISOString()
      const environment = createInterestEnvironment(interestSeed)
      const stateBefore = environment.snapshot()
      const customer = createInterestCustomer(environment, interestScenario)
      const events: Event[] = []
      let finalAnswer: string | undefined
      let run: CaseRun
      try {
        const host = await createBunHost({ actor: createInterestAgent(options.agentVersion, environment), storage: ":memory:", layersFor: () => layers })
        let polling = true
        const thread = await host.allocateRootThread({ instance: query.id, name: "main" })
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
        const deadline = Date.now() + 240_000
        let customerText: string | null = customer.initialMessage
        streamPacket({ kind: "status", message: "Running multi-turn interest investigation…" })
        try {
          for (let turn = 0; customerText !== null && turn < 15; turn++) {
            const remaining = deadline - Date.now()
            if (remaining <= 0) throw new Error("interest investigation exceeded its total deadline")
            finalAnswer = await thread.methods.message(
              { text: customerText, model: options.agentModel },
              { key: `request-${turn}`, timeoutMs: Math.min(options.timeoutMs, remaining) },
            )
            const response = customer.respond(finalAnswer)
            customerText = response?.startsWith("Thank you for being so thorough") ? null : response
          }
          if (customerText !== null) throw new Error("interest investigation exceeded its turn limit")
        } finally {
          polling = false
          try { await poller } finally { await host.close() }
        }
        const stateAfter = environment.snapshot()
        run = {
          id: query.id, agentVersion: options.agentVersion, request: customer.initialMessage, status: "judged", finalAnswer,
          events, trajectory: replayProjection(trajectoryProjection, events), stateBefore, stateAfter,
          stateChecks: evaluateInterestState(stateBefore, stateAfter), startedAt, finishedAt: new Date().toISOString(),
        } as unknown as CaseRun
      } catch (error) {
        const stateAfter = environment.snapshot()
        run = {
          id: query.id, agentVersion: options.agentVersion, request: customer.initialMessage, status: "error",
          error: { stage: "agent", message: errorMessage(error) }, events, trajectory: replayProjection(trajectoryProjection, events),
          stateBefore, stateAfter, stateChecks: evaluateInterestState(stateBefore, stateAfter), startedAt, finishedAt: new Date().toISOString(),
        } as unknown as CaseRun
      }
      results.push(run)
      await writeFile(join(options.output, `${query.id}.json`), JSON.stringify(run, null, 2) + "\n")
      continue
    }
    const startedAt = new Date().toISOString()
    const bank = createBankState(await loadSeedState())
    const stateBefore = bank.snapshot()
    const events: Event[] = []
    let finalAnswer: string | undefined
    let run: CaseRun

    try {
      const host = await createBunHost({ actor: createAgentVersion(options.agentVersion, bank, query.customerId), storage: ":memory:", layersFor: () => layers })
      let thread: Awaited<ReturnType<typeof host.allocateRootThread>> | undefined
      let polling = false
      let poller: Promise<void> | undefined
      try {
        thread = await host.allocateRootThread({ instance: query.id, name: "main" })
        const syncEvents = async () => {
          const stored = await hostBackend(host).instances.get(query.id)!.read(thread!.coordinate.thread)
          for (const event of stored.slice(events.length)) {
            events.push(event)
            streamPacket({ kind: "event", event })
          }
        }
        streamPacket({ kind: "status", message: "Running banking agent…" })
        polling = true
        poller = (async () => {
          while (polling) {
            await syncEvents()
            await Bun.sleep(100)
          }
          await syncEvents()
        })()
        finalAnswer = await thread.methods.message({ text: query.request, model: options.agentModel }, { key: "request", timeoutMs: options.timeoutMs })
      } finally {
        polling = false
        try {
          if (poller !== undefined) await poller
          else if (thread !== undefined) {
            const stored = await hostBackend(host).instances.get(query.id)!.read(thread.coordinate.thread)
            for (const event of stored) {
              events.push(event)
              streamPacket({ kind: "event", event })
            }
          }
        } finally {
          await host.close()
        }
      }
    } catch (error) {
      const stateAfter = bank.snapshot()
      run = { id: query.id, agentVersion: options.agentVersion, request: query.request, status: "error", error: { stage: "agent", message: errorMessage(error) }, events, trajectory: replayProjection(trajectoryProjection, events), stateBefore, stateAfter, stateChecks: evaluateState(query.id, stateBefore, stateAfter), startedAt, finishedAt: new Date().toISOString() }
      results.push(run)
      await writeFile(join(options.output, `${query.id}.json`), JSON.stringify(run, null, 2) + "\n")
      continue
    }

    const stateAfter = bank.snapshot()
    const stateChecks = evaluateState(query.id, stateBefore, stateAfter)
    try {
      streamPacket({ kind: "status", message: "Judging response…" })
      const judgeHost = await createBunHost({ actor: judgeActor, storage: ":memory:", layersFor: () => layers })
      let judgment
      try {
        const thread = await judgeHost.allocateRootThread({ instance: `judge-${query.id}`, name: "main" })
        const output = await thread.methods.message({ text: judgePrompt(query.request, expectedAnswers[query.id]!, finalAnswer!), model: options.judgeModel }, { key: "judge", timeoutMs: options.timeoutMs })
        judgment = parseJudgment(output)
      } finally {
        await judgeHost.close()
      }
      run = { id: query.id, agentVersion: options.agentVersion, request: query.request, status: "judged", finalAnswer, judgment: { ...judgment, scope: "response-only" }, events, trajectory: replayProjection(trajectoryProjection, events), stateBefore, stateAfter, stateChecks, startedAt, finishedAt: new Date().toISOString() }
    } catch (error) {
      run = { id: query.id, agentVersion: options.agentVersion, request: query.request, status: "error", finalAnswer, error: { stage: "judge", message: errorMessage(error) }, events, trajectory: replayProjection(trajectoryProjection, events), stateBefore, stateAfter, stateChecks, startedAt, finishedAt: new Date().toISOString() }
    }
    results.push(run)
    await writeFile(join(options.output, `${query.id}.json`), JSON.stringify(run, null, 2) + "\n")
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    agentVersion: options.agentVersion,
    agentModel: options.agentModel,
    judgeModel: options.judgeModel,
    counts: {
      total: results.length,
      passed: results.filter((run) => run.status === "judged" && run.judgment?.pass && run.stateChecks.pass).length,
      failed: results.filter((run) => run.status === "judged" && (!run.judgment?.pass || !run.stateChecks.pass)).length,
      errors: results.filter((run) => run.status === "error").length,
      responsePassed: results.filter((run) => run.judgment?.pass).length,
      statePassed: results.filter((run) => run.stateChecks.pass).length,
    },
    cases: results,
  }
  await writeFile(join(options.output, "summary.json"), JSON.stringify(summary, null, 2) + "\n")
  console.log(JSON.stringify({ output: options.output, ...summary.counts }, null, 2))
}

if (import.meta.main) await main()
