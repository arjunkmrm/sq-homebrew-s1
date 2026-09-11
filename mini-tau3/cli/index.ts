import { Command, CommanderError } from "commander"
import { startInspector } from "../inspector/server.ts"
import { challenge, toChallengeOptions, type ChallengeCommandOptions } from "./challenge.ts"
import { evaluateSavedRun } from "./evaluate.ts"
import { run, toRunOptions, type RunCommandOptions } from "./run.ts"
import { scoreSavedRuns } from "./score.ts"

const program = new Command()
  .name("bun run cli")
  .description("Run, evaluate, score, inspect, and compare mini-tau3 agents.")
  .showHelpAfterError()
  .exitOverride()
  .configureOutput({ writeErr: () => {} })

program
  .command("run")
  .description("Run an agent against one or more banking tasks.")
  .option("--agent-file <file>", "agent module exporting createAgent")
  .option("--agent-model <provider:model>", "agent model")
  .option("--customer-model <provider:model>", "customer model")
  .option("--cases <ids>", "comma-separated task ids, or all")
  .option("--output <dir>", "directory for run artifacts")
  .option("--timeout-ms <milliseconds>", "total timeout per case")
  .option("--dry-run", "validate the selected run without calling a model")
  .option("--list-tasks", "list available task ids without requiring model configuration")
  .action(async (options: RunCommandOptions) => run(toRunOptions(options)))

program
  .command("challenge")
  .description("Compare agents across tasks and trials.")
  .option("--agents <files>", "comma-separated agent module paths")
  .option("--trials <count>", "trials per agent and task")
  .option("--concurrency <count>", "maximum concurrent runs, 1–10 (default: 10)")
  .option("--output <dir>", "directory for challenge artifacts")
  .option("--model <provider:model>", "agent model")
  .option("--customer-model <provider:model>", "customer model")
  .option("--timeout-ms <milliseconds>", "total timeout per case")
  .option("--cases <ids>", "comma-separated task ids, or all (default: all)")
  .action(async (options: ChallengeCommandOptions) => challenge(toChallengeOptions(options)))

program
  .command("eval <file>")
  .description("Evaluate a saved case or summary JSON file.")
  .action(evaluateSavedRun)

program
  .command("score <file>")
  .description("Score a saved case or summary JSON file.")
  .action(scoreSavedRuns)

program
  .command("inspect <file>")
  .description("Open the local inspector for a saved case or summary JSON file.")
  .option("--no-open", "do not open the browser")
  .action((file: string, options: { open: boolean }) => startInspector(file, options))

export async function main(argv = Bun.argv): Promise<void> {
  try {
    await program.parseAsync(argv)
  } catch (error) {
    if (error instanceof CommanderError) {
      if (error.code !== "commander.helpDisplayed") console.error(error.message)
      process.exitCode = error.exitCode
      return
    }
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
}

if (import.meta.main) await main()
