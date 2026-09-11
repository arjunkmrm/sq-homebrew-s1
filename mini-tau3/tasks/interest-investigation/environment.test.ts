import { describe, expect, test } from "bun:test"
import { createInterestEnvironment, CUSTOMER_ID, InterestToolError } from "./environment.ts"

const identity = { name: "Marcus Chen-Williams", phone: "206-555-4729", email: "marcus.chenwilliams@gmail.com", dateOfBirth: "07/18/1980", address: "2934 Queen Anne Avenue North, Unit 8B, Seattle, WA 98109" }

describe("interest investigation environment", () => {
  test("isolates runs and returns defensive snapshots", () => {
    const first = createInterestEnvironment(); const second = createInterestEnvironment()
    const copy = first.snapshot(); copy.accounts[0]!.balanceCents = 1
    expect(first.snapshot().accounts[0]!.balanceCents).toBe(10_000_000)
    expect(second.snapshot().audit).toEqual([])
  })

  test("rejects unauthorized mutation and records the failed operation", () => {
    const env = createInterestEnvironment()
    expect(() => env.applyCredit({ accountId: "sav_mc80w7k3x9_silver", amountCents: 1, creditType: "interest_correction" })).toThrow(InterestToolError)
    expect(env.snapshot().credits).toHaveLength(0)
    expect(env.snapshot().audit.at(-1)).toMatchObject({ action: "applyCredit", ok: false, reason: "VERIFICATION_REQUIRED" })
  })

  test("permits an intentionally wrong credit after verification and consent so scoring can observe it", () => {
    const env = createInterestEnvironment(); env.verifyCustomer(identity)
    env.recordCustomerMessage("Yes, please apply the credits for the differences.")
    env.applyCredit({ accountId: "sav_mc80w7k3x9_silver", amountCents: 999, creditType: "interest_correction" })
    const snapshot = env.snapshot()
    expect(snapshot.credits[0]).toMatchObject({ accountId: "sav_mc80w7k3x9_silver", amountCents: 999 })
    expect(snapshot.accounts.find(a => a.id === "sav_mc80w7k3x9_silver")!.balanceCents).toBe(10_000_999)
  })

  test("reports require separate consent and a prior account credit", () => {
    const env = createInterestEnvironment(); env.verifyCustomer(identity)
    env.recordCustomerMessage("Yes, apply the credit difference please.")
    env.applyCredit({ accountId: "sav_mc80w7k3x9_silver", amountCents: 22_084, creditType: "interest_correction" })
    const report = { accountId: "sav_mc80w7k3x9_silver", userId: CUSTOMER_ID, expectedApy: 6.65, actualApy: 4, amountDifferenceCents: 22_084 }
    expect(() => env.submitReport(report)).toThrow("explicit customer consent")
    env.recordCustomerMessage("Yes, please submit reports for the investigation.")
    expect(env.submitReport(report)).toMatchObject(report)
    expect(env.snapshot().consent.reportsAtSeq).toBeGreaterThan(env.snapshot().verification.verifiedAtSeq!)
  })
})
