import { describe, expect, test } from "bun:test"
import { parseJudgment } from "./judge.ts"
import { parseArgs } from "../run.ts"

describe("eval input validation", () => {
  test("parses distinct agent and judge models", () => {
    const options = parseArgs(["--agent-model", "openai:gpt-agent", "--judge-model", "openrouter:gpt-judge", "--cases", "a,b", "--dry-run"])
    expect(options.agentModel).toEqual({ provider: "openai", model_id: "gpt-agent" })
    expect(options.judgeModel).toEqual({ provider: "openrouter", model_id: "gpt-judge" })
    expect(options.cases).toEqual(["a", "b"])
    expect(options.agentVersion).toBe("baseline")
    expect(options.dryRun).toBe(true)
  })

  test("accepts only known agent versions", () => {
    expect(parseArgs(["--agent-model", "openai:gpt-agent", "--agent-version", "verify"]).agentVersion).toBe("verify")
    expect(() => parseArgs(["--agent-model", "openai:gpt-agent", "--agent-version", "invented"])).toThrow("unknown agent version")
  })

  test("parses a fenced judge result and keeps its rationale", () => {
    expect(parseJudgment('```json\n{"pass":true,"score":0.9,"rationale":"All facts match."}\n```')).toEqual({ pass: true, score: 0.9, rationale: "All facts match." })
  })

  test("rejects malformed judge output", () => {
    expect(() => parseJudgment('{"pass":true}')).toThrow("invalid JSON")
  })
})
