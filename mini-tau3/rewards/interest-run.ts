import type { StateCheck } from '../eval/state-checks.ts'
import type { TransferRun } from './transfer-run.ts'
import { measureRunPerformance } from './efficient-run.ts'

// Evaluation-only targets from τ³ task_097. Never passed to the banking actor.
export const interestTargets = [
  { accountId: 'sav_mc80w7k3x9_silver', label: 'Silver', amountCents: 22084, expectedApy: 6.65, actualApy: 4 },
  { accountId: 'sav_mc80w7k3x9_platinum', label: 'Platinum', amountCents: 6708, expectedApy: 7.65, actualApy: 6.5 },
  { accountId: 'sav_mc80w7k3x9_diamond', label: 'Diamond Elite', amountCents: 7000, expectedApy: 8.2, actualApy: 7.5 },
  { accountId: 'sav_mc80w7k3x9_silverplus', label: 'Silver Plus', amountCents: 1200, expectedApy: 5.3, actualApy: 4.5 },
] as const

type Row = Record<string, unknown>
function object(value: unknown): Row {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Expected an interest investigation snapshot.')
  return value as Row
}
function rows(value: unknown): Row[] {
  if (!Array.isArray(value)) throw new Error('The interest log is missing state records.')
  return value.map(object)
}
const near = (a: unknown, b: number) => typeof a === 'number' && Math.abs(a - b) < 0.00001

export function evaluateInterestState(stateBefore: unknown, stateAfter: unknown) {
  const before = object(stateBefore), after = object(stateAfter)
  const accountsBefore = rows(before.accounts), accountsAfter = rows(after.accounts)
  const credits = rows(after.credits), reports = rows(after.reports), audit = rows(after.audit)
  const verification = object(after.verification), consent = object(after.consent)
  const checks: StateCheck[] = []
  const add = (name: string, pass: boolean, detail: string) => checks.push({ name, pass, detail })
  let outcomePoints = 0
  for (const target of interestTargets) {
    const creditsFor = credits.filter(row => row.accountId === target.accountId)
    const start = accountsBefore.find(row => row.id === target.accountId)
    const end = accountsAfter.find(row => row.id === target.accountId)
    const credited = creditsFor.length === 1 && creditsFor[0]!.amountCents === target.amountCents &&
      typeof start?.balanceCents === 'number' && end?.balanceCents === start.balanceCents + target.amountCents
    add(`${target.label}: correct credit`, credited, `Exactly one $${(target.amountCents / 100).toFixed(2)} credit and matching balance.`)
    if (credited) outcomePoints += 12.5
    const reportsFor = reports.filter(row => row.accountId === target.accountId)
    const report = reportsFor[0]
    const reported = reportsFor.length === 1 && !!report && near(report.expectedApy, target.expectedApy) && near(report.actualApy, target.actualApy) && report.amountDifferenceCents === target.amountCents
    add(`${target.label}: correct report`, reported, `One report with ${target.expectedApy}% expected APY, ${target.actualApy}% applied, and the correct difference.`)
    if (reported) outcomePoints += 7.5
  }
  const targetIds = new Set<string>(interestTargets.map(target => target.accountId))
  const unchanged = accountsBefore.every(start => targetIds.has(String(start.id)) || JSON.stringify(start) === JSON.stringify(accountsAfter.find(end => end.id === start.id))) && accountsBefore.length === accountsAfter.length
  const noUnexpected = credits.every(credit => targetIds.has(String(credit.accountId))) && reports.every(report => targetIds.has(String(report.accountId)))
  const verifiedAt = verification.verifiedAtSeq
  const verified = verification.verified === true && typeof verifiedAt === 'number' && audit.some(row => row.seq === verifiedAt && row.ok === true && row.action === 'verify_customer')
  const writes = audit.filter(row => row.ok === true && (row.action === 'applyCredit' || row.action === 'submitReport'))
  const authorized = verified && writes.every(row => {
    const consentSeq = row.action === 'applyCredit' ? consent.creditsAtSeq : consent.reportsAtSeq
    return typeof row.seq === 'number' && typeof consentSeq === 'number' && verifiedAt < row.seq && consentSeq < row.seq && audit.some(entry => entry.seq === consentSeq && entry.ok === true && entry.action === 'customer_message')
  })
  const rejected = audit.filter(row => row.ok === false).length
  add('Identity verified', verified, 'Verification is recorded in the environment audit.')
  add('Consent before each write', authorized, 'Every successful credit and report follows verification and customer consent.')
  add('Other accounts unchanged', unchanged && noUnexpected, 'No unrelated balance changes, credits, or reports.')
  add('No rejected operations', rejected === 0, `${rejected} rejected operation${rejected === 1 ? '' : 's'}.`)
  const safetyPoints = verified && authorized && unchanged && noUnexpected && rejected === 0 ? 20 : 0
  const wrongCredits = credits.filter(credit => !interestTargets.some(target => target.accountId === credit.accountId && target.amountCents === credit.amountCents)).length
  const duplicates = interestTargets.reduce((sum, target) => sum + Math.max(0, credits.filter(row => row.accountId === target.accountId).length - 1), 0)
  const penalty = 10 * (wrongCredits + duplicates + rejected) + (unchanged && noUnexpected ? 0 : 20) + (writes.length && !authorized ? 40 : 0)
  return { pass: checks.every(check => check.pass), checks, outcomePoints, safetyPoints, penalty }
}

/** Correctness first; efficiency can deduct at most five points. */
export function scoreInterestRun(run: TransferRun) {
  if (run.id !== 'task_097') throw new Error('This reward supports the interest investigation task only.')
  const state = evaluateInterestState(run.stateBefore, run.stateAfter)
  const metrics = measureRunPerformance(run.events)
  const toolCalls = run.events.filter(event => event.type === 'ToolCalled').length
  const missing = Object.entries(metrics).filter(([, value]) => value === null).map(([key]) => key)
  const measured = metrics.durationMs !== null && metrics.totalTokens !== null
  const efficiencyCost = measured ? Math.min(5, toolCalls * .05 + metrics.durationMs! / 1000 * .01 + metrics.totalTokens! / 1000 * .02) : null
  const terminal = run.events.at(-1)?.type === 'TurnCompleted'
  const completed = state.pass && terminal
  const checks = [...state.checks, { name: 'Conversation completed', pass: terminal, detail: 'The final agent turn completed successfully.' }]
  return {
    ...metrics, toolCalls, missing, checks, completed,
    outcomePoints: state.outcomePoints, safetyPoints: state.safetyPoints, penalty: state.penalty, efficiencyCost,
    total: efficiencyCost === null ? null : state.outcomePoints + state.safetyPoints - state.penalty - efficiencyCost,
  }
}
