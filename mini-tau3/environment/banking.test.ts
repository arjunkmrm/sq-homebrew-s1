import { describe, expect, test } from "bun:test"
import { createBankingEnvironment } from "./banking.ts"
import { createBankingTaskSeed, loadBankingTask } from "../tasks/index.ts"
const interestSeed = createBankingTaskSeed(loadBankingTask("task_097"))

describe("canonical tau banking environment", () => {
  test("keeps canonical snapshots isolated from adapter audit", () => {
    const env = createBankingEnvironment(interestSeed)
    env.tools.get_current_time()
    const snapshot = env.snapshot()
    expect(snapshot.users.data.mc80w7k3x9?.name).toBe("Marcus Chen-Williams")
    expect("audit" in snapshot).toBeFalse()
    expect(env.auditSnapshot()).toHaveLength(1)
  })

  test("requires discoverable tools to be unlocked and applies upstream-shaped credits", () => {
    const env = createBankingEnvironment(interestSeed)
    const call = { agent_tool_name: "apply_savings_account_credit_6831", arguments: JSON.stringify({ account_id: "sav_mc80w7k3x9_silver", amount: 220.84, credit_type: "interest_correction" }) }
    expect(env.tools.call_discoverable_agent_tool(call)).toContain("has not been unlocked")
    env.tools.unlock_discoverable_agent_tool({ agent_tool_name: call.agent_tool_name })
    expect(env.tools.call_discoverable_agent_tool(call)).toContain("Credit applied successfully")
    expect(env.snapshot().accounts.data.sav_mc80w7k3x9_silver?.current_holdings).toBe("100220.84")
    expect(Object.values(env.snapshot().bank_account_transaction_history.data).at(-1)).toMatchObject({ amount: 220.84, type: "interest_correction" })
  })
})
