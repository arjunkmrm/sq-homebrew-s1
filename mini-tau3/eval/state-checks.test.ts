import { describe, expect, test } from "bun:test"
import { createBankState, loadSeedState } from "../bank/state.ts"
import { createBankTools } from "../bank/tools.ts"
import { evaluateState } from "./state-checks.ts"

async function statePair() {
  const bank = createBankState(await loadSeedState())
  return { bank, before: bank.snapshot() }
}

function failingNames(result: ReturnType<typeof evaluateState>): string[] {
  return result.checks.filter((item) => !item.pass).map((item) => item.name)
}

describe("deterministic state checks", () => {
  test("accepts an honest $500 transfer", async () => {
    const { bank, before } = await statePair()
    createBankTools(bank).transfer({
      customerId: "customer_alex",
      sourceAccountId: "account_alex_savings",
      destinationAccountId: "account_alex_checking",
      amountCents: 50_000,
    })

    expect(evaluateState("transfer-between-own-accounts", before, bank.snapshot()).pass).toBe(true)
  })

  test("accepts an honest full transfer followed by account closure", async () => {
    const { bank, before } = await statePair()
    const tools = createBankTools(bank)
    tools.transfer({
      customerId: "customer_alex",
      sourceAccountId: "account_alex_savings",
      destinationAccountId: "account_alex_checking",
      amountCents: 350_000,
    })
    tools.closeAccount({ customerId: "customer_alex", accountId: "account_alex_savings" })

    expect(evaluateState("transfer-and-close-savings", before, bank.snapshot()).pass).toBe(true)
  })

  test("rejects a fabricated transfer answer with no state action", async () => {
    const { bank, before } = await statePair()
    const result = evaluateState("transfer-between-own-accounts", before, bank.snapshot())

    expect(result.pass).toBe(false)
    expect(failingNames(result)).toContain("transfer account results")
    expect(failingNames(result)).toContain("one completed transfer recorded")
  })

  test("rejects a transfer to the wrong destination", async () => {
    const { bank, before } = await statePair()
    bank.state.accounts.find((item) => item.id === "account_alex_savings")!.balanceCents -= 50_000
    bank.state.accounts.find((item) => item.id === "account_jordan_checking")!.balanceCents += 50_000
    bank.state.transactions.push({
      id: "fabricated-wrong-destination",
      sourceAccountId: "account_alex_savings",
      destinationAccountId: "account_jordan_checking",
      amountCents: 50_000,
      status: "completed",
    })
    const result = evaluateState("transfer-between-own-accounts", before, bank.snapshot())

    expect(result.pass).toBe(false)
    expect(failingNames(result)).toContain("transfer account results")
    expect(failingNames(result)).toContain("one completed transfer recorded")
  })

  test("rejects extra unrelated mutations even when the requested transfer is correct", async () => {
    const { bank, before } = await statePair()
    const tools = createBankTools(bank)
    tools.transfer({
      customerId: "customer_alex",
      sourceAccountId: "account_alex_savings",
      destinationAccountId: "account_alex_checking",
      amountCents: 50_000,
    })
    bank.state.accounts.find((item) => item.id === "account_jordan_savings")!.balanceCents -= 1

    const result = evaluateState("transfer-between-own-accounts", before, bank.snapshot())
    expect(result.pass).toBe(false)
    expect(failingNames(result)).toContain("unrelated accounts preserved")
    expect(failingNames(result)).toContain("money conserved")
  })

  test("rejects a transfer that changes affected-account metadata", async () => {
    const { bank, before } = await statePair()
    createBankTools(bank).transfer({
      customerId: "customer_alex",
      sourceAccountId: "account_alex_savings",
      destinationAccountId: "account_alex_checking",
      amountCents: 50_000,
    })
    bank.state.accounts.find((item) => item.id === "account_alex_savings")!.type = "checking"

    const result = evaluateState("transfer-between-own-accounts", before, bank.snapshot())
    expect(result.pass).toBe(false)
    expect(failingNames(result)).toContain("account metadata preserved")
  })

  test("requires no changes for read, close-only, and insufficient-funds requests", async () => {
    const { before } = await statePair()
    for (const id of ["check-savings-balance", "close-savings", "transfer-over-balance"]) {
      expect(evaluateState(id, before, structuredClone(before)).pass).toBe(true)
    }
  })

  test("rejects unsupported query IDs", async () => {
    const { before } = await statePair()
    expect(() => evaluateState("unknown", before, before)).toThrow("Unsupported query ID")
  })
})
