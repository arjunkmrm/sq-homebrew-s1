import { spawn } from "node:child_process"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { basename, isAbsolute, join, resolve } from "node:path"
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
  const concurrency = Number(values.concurrency ?? 2)
  const timeoutMs = Number(values.timeoutMs ?? 240_000)
  if (!agents.length) throw new Error("--agents must name at least one file")
  if (!Number.isSafeInteger(trials) || trials < 1 || trials > 10) throw new Error("--trials must be an integer from 1 to 10")
  if (!Number.isSafeInteger(concurrency) || concurrency < 1 || concurrency > 4) throw new Error("--concurrency must be an integer from 1 to 4")
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 240_000) throw new Error("--timeout-ms must be an integer from 1 to 240000")
  const cases = (values.cases ?? "task_097").split(",").filter(Boolean)
  return { agents, trials, concurrency, output: resolve(values.output ?? join("runs", `challenge-${new Date().toISOString().replaceAll(":", "-")}`)), model: values.model, customerModel: values.customerModel ?? process.env.TAU3_CUSTOMER_MODEL ?? process.env.TAU3_AGENT_MODEL, timeoutMs, cases }
}

const runProcess = (args: string[]) => new Promise<number>((resolveRun, reject) => {
  const child = spawn(process.execPath, ["run", fileURLToPath(new URL("./index.ts", import.meta.url)), "run", ...args], { cwd: fileURLToPath(new URL("../", import.meta.url)), env: process.env, stdio: ["ignore", "ignore", "ignore"] })
  child.once("error", reject)
  child.once("exit", code => resolveRun(code ?? -1))
})

export async function challenge(options: ChallengeOptions) {
  const caseIds = options.cases.includes("all") ? bankingTaskIds : options.cases
  const unknown = caseIds.filter(id => !bankingTaskIds.includes(id as typeof bankingTaskIds[number]))
  if (unknown.length > 0) throw new Error(`unknown cases: ${unknown.join(", ")}`)
  if (caseIds.length === 0) throw new Error("no cases selected")
  await mkdir(options.output, { recursive: true })
  const jobs = options.agents.flatMap((agentFile, agentIndex) => caseIds.flatMap(taskId => Array.from({ length: options.trials }, (_, trialIndex) => ({ agentFile, agentIndex, taskId, trialIndex }))))
  const runs: Array<{ agentFile: string; agentIndex: number; taskId: string; trialIndex: number; run?: CaseRun; error?: string }> = []
  let next = 0
  await Promise.all(Array.from({ length: Math.min(options.concurrency, jobs.length) }, async () => {
    while (next < jobs.length) {
      const job = jobs[next++]!
      const label = `${job.agentIndex + 1}-${basename(job.agentFile).replace(/\.[^.]+$/, "")}`
      const directory = join(options.output, label, job.taskId, `trial-${job.trialIndex + 1}`)
      const args = ["--cases", job.taskId, "--agent-file", job.agentFile, "--output", directory, "--timeout-ms", String(options.timeoutMs)]
      if (options.model) args.push("--agent-model", options.model)
      if (options.customerModel) args.push("--customer-model", options.customerModel)
      try {
        const exitCode = await runProcess(args)
        const run = JSON.parse(await readFile(join(directory, `${job.taskId}.json`), "utf8")) as CaseRun
        runs.push({ ...job, run, ...(exitCode === 0 ? {} : { error: `runner exited with status ${exitCode}` }) })
      } catch (error) {
        runs.push({ ...job, error: error instanceof Error ? error.message : "run failed" })
      }
    }
  }))
  const leaderboard = options.agents.map((agentFile, agentIndex) => {
    const entries = runs.filter(run => run.agentIndex === agentIndex)
    const scored = entries.map(entry => {
      if (!entry.run) return { entry, score: undefined, error: entry.error ?? "run artifact missing" }
      try { return { entry, score: scoreSavedRun(entry.run), error: entry.error } }
      catch (error) { return { entry, score: undefined, error: error instanceof Error ? error.message : "scoring failed" } }
    })
    const numeric = (field: "total" | "durationMs" | "totalTokens") => {
      const values = scored.map(entry => entry.score?.[field])
      if (field === "total") return values.reduce<number>((sum, value) => sum + (typeof value === "number" ? value : 0), 0) / entries.length
      return values.every((value): value is number => typeof value === "number") && values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null
    }
    return {
      agent: basename(agentFile), agentFile, trials: entries.length,
      successful: scored.filter(entry => entry.score?.completed).length,
      averageReward: numeric("total"), averageDurationMs: numeric("durationMs"), averageTokens: numeric("totalTokens"),
      errors: scored.filter(entry => entry.error || entry.entry.run?.status === "error").length,
    }
  }).sort((left, right) => (right.averageReward ?? -Infinity) - (left.averageReward ?? -Infinity) || right.successful - left.successful)
    .map((entry, index) => ({ rank: index + 1, ...entry }))
  const result = { generatedAt: new Date().toISOString(), tasks: caseIds, model: options.model ?? process.env.TAU3_AGENT_MODEL ?? "configured default", customerModel: options.customerModel ?? "configured default", trialsPerTask: options.trials, leaderboard }
  await writeFile(join(options.output, "leaderboard.json"), JSON.stringify(result, null, 2) + "\n")
  console.log(JSON.stringify(result, null, 2))
}
