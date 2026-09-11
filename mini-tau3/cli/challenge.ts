import { spawn } from "node:child_process"
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises"
import { basename, dirname, isAbsolute, join, relative, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { scoreSavedRun } from "../rewards/score.ts"
import { bankingTaskIds } from "../tasks/index.ts"
import type { CaseRun } from "../types.ts"

export type ChallengeOptions = {
  agents: string[]
  trials: number
  concurrency: number
  output: string
  model?: string
  customerModel?: string
  timeoutMs: number
  cases: string[]
  /** Identifies all of the artifacts created by one challenge invocation. */
  runId?: string
}

export type ChallengeCommandOptions = {
  agents?: string
  trials?: string
  concurrency?: string
  output?: string
  model?: string
  customerModel?: string
  timeoutMs?: string
  cases?: string
}

export function toChallengeOptions(values: ChallengeCommandOptions): ChallengeOptions {
  const defaultAgent = fileURLToPath(new URL("../agents/baseline/actor.ts", import.meta.url))
  const agents = (values.agents ?? defaultAgent).split(",").filter(Boolean).map(file => isAbsolute(file) ? file : resolve(process.cwd(), file))
  const trials = Number(values.trials ?? 1)
  const concurrency = Number(values.concurrency ?? 10)
  const timeoutMs = Number(values.timeoutMs ?? 240_000)
  if (!agents.length) throw new Error("--agents must name at least one file")
  if (!Number.isSafeInteger(trials) || trials < 1 || trials > 10) throw new Error("--trials must be an integer from 1 to 10")
  if (!Number.isSafeInteger(concurrency) || concurrency < 1 || concurrency > 10) throw new Error("--concurrency must be an integer from 1 to 10")
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 240_000) throw new Error("--timeout-ms must be an integer from 1 to 240000")
  const cases = (values.cases ?? "all").split(",").filter(Boolean)
  const runId = `challenge-${new Date().toISOString().replaceAll(":", "-")}`
  return { agents, trials, concurrency, output: resolve(values.output ?? join("runs", runId)), model: values.model, customerModel: values.customerModel ?? process.env.TAU3_CUSTOMER_MODEL ?? process.env.TAU3_AGENT_MODEL, timeoutMs, cases, runId }
}

const runProcess = (args: string[]) => new Promise<number>((resolveRun, reject) => {
  const child = spawn(process.execPath, ["run", fileURLToPath(new URL("./index.ts", import.meta.url)), "run", ...args], { cwd: fileURLToPath(new URL("../", import.meta.url)), env: process.env, stdio: ["ignore", "ignore", "ignore"] })
  child.once("error", reject)
  child.once("exit", code => resolveRun(code ?? -1))
})

const agentLabel = (file: string) => basename(file) === "actor.ts"
  ? basename(dirname(file))
  : basename(file).replace(/\.[^.]+$/, "")

const artifactLabel = (file: string, index: number) => `${index + 1}-${basename(file).replace(/\.[^.]+$/, "")}`

export async function challenge(options: ChallengeOptions) {
  const startedAt = new Date().toISOString()
  const runId = options.runId ?? `challenge-${startedAt.replaceAll(":", "-")}`
  const caseIds = options.cases.includes("all") ? bankingTaskIds : options.cases
  const unknown = caseIds.filter(id => !bankingTaskIds.includes(id as typeof bankingTaskIds[number]))
  if (unknown.length > 0) throw new Error(`unknown cases: ${unknown.join(", ")}`)
  if (caseIds.length === 0) throw new Error("no cases selected")
  await mkdir(options.output, { recursive: true })
  if ((await readdir(options.output)).length > 0) throw new Error(`challenge output directory is not empty: ${options.output}`)
  const jobs = options.agents.flatMap((agentFile, agentIndex) => Array.from({ length: options.trials }, (_, trialIndex) => caseIds.map(taskId => ({
    agentFile, agentIndex, taskId, trialIndex,
  }))).flat()).map((job, jobIndex) => ({ ...job, jobIndex }))
  const runs: Array<{ agentFile: string; agentIndex: number; taskId: string; trialIndex: number; jobIndex: number; run?: CaseRun; error?: string }> = new Array(jobs.length)
  let next = 0
  await Promise.all(Array.from({ length: Math.min(options.concurrency, jobs.length) }, async () => {
    while (next < jobs.length) {
      const job = jobs[next++]!
      const label = artifactLabel(job.agentFile, job.agentIndex)
      const directory = join(options.output, label, job.taskId, `trial-${job.trialIndex + 1}`)
      const args = ["--cases", job.taskId, "--agent-file", job.agentFile, "--output", directory, "--timeout-ms", String(options.timeoutMs)]
      if (options.model) args.push("--agent-model", options.model)
      if (options.customerModel) args.push("--customer-model", options.customerModel)
      try {
        const exitCode = await runProcess(args)
        const run = JSON.parse(await readFile(join(directory, `${job.taskId}.json`), "utf8")) as CaseRun
        runs[job.jobIndex] = { ...job, run, ...(exitCode === 0 ? {} : { error: `runner exited with status ${exitCode}` }) }
      } catch (error) {
        runs[job.jobIndex] = { ...job, error: error instanceof Error ? error.message : "run failed" }
      }
    }
  }))
  const scoredRuns = runs.map(entry => {
    if (!entry.run) return { entry, score: undefined, error: entry.error ?? "run artifact missing" }
    try { return { entry, score: scoreSavedRun(entry.run), error: entry.error } }
    catch (error) { return { entry, score: undefined, error: error instanceof Error ? error.message : "scoring failed" } }
  })
  const leaderboard = options.agents.map((agentFile, agentIndex) => {
    const scored = scoredRuns.filter(({ entry }) => entry.agentIndex === agentIndex)
    const entries = scored.map(({ entry }) => entry)
    const numeric = (field: "total" | "durationMs" | "totalTokens") => {
      const values = scored.map(entry => entry.score?.[field])
      if (field === "total") return values.reduce<number>((sum, value) => sum + (typeof value === "number" ? value : 0), 0) / entries.length
      return values.every((value): value is number => typeof value === "number") && values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null
    }
    return {
      agent: agentLabel(agentFile), agentFile, trials: entries.length,
      successful: scored.filter(entry => entry.score?.completed).length,
      averageReward: numeric("total"), averageDurationMs: numeric("durationMs"), averageTokens: numeric("totalTokens"),
      errors: scored.filter(entry => entry.error || entry.entry.run?.status === "error").length,
    }
  }).sort((left, right) => (right.averageReward ?? -Infinity) - (left.averageReward ?? -Infinity) || right.successful - left.successful)
    .map((entry, index) => ({ rank: index + 1, ...entry }))
  const models = {
    agent: options.model ?? process.env.TAU3_AGENT_MODEL ?? null,
    customer: options.customerModel ?? process.env.TAU3_CUSTOMER_MODEL ?? options.model ?? process.env.TAU3_AGENT_MODEL ?? null,
  }
  const cases = scoredRuns.map(({ entry, score, error }) => {
    const label = agentLabel(entry.agentFile)
    const directory = join(options.output, artifactLabel(entry.agentFile, entry.agentIndex), entry.taskId, `trial-${entry.trialIndex + 1}`)
    const logFile = relative(options.output, join(directory, `${entry.taskId}.json`))
    return {
      ...(entry.run ?? {}),
      id: entry.taskId,
      events: entry.run?.events ?? [],
      agent: label,
      agentFile: entry.agentFile,
      trial: entry.trialIndex + 1,
      attemptId: `${runId}-${entry.agentIndex + 1}-${entry.taskId}-trial-${entry.trialIndex + 1}`,
      logFile,
      status: entry.run?.status ?? "error",
      ...(error ? { error } : {}),
      ...(score ? { score } : {}),
    }
  })
  const summary = {
    kind: "challenge" as const,
    runId,
    startedAt,
    finishedAt: new Date().toISOString(),
    models,
    trialsPerTask: options.trials,
    concurrency: options.concurrency,
    tasks: caseIds,
    leaderboard,
    cases,
  }
  const { cases: _cases, ...leaderboardResult } = summary
  await Promise.all([
    writeFile(join(options.output, "summary.json"), JSON.stringify(summary, null, 2) + "\n"),
    writeFile(join(options.output, "leaderboard.json"), JSON.stringify(leaderboardResult, null, 2) + "\n"),
  ])
  console.log(JSON.stringify({ ...leaderboardResult, summaryFile: join(options.output, "summary.json") }, null, 2))
}
