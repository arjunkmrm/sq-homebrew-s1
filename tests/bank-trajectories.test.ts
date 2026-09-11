import { expect, test } from 'bun:test'
import { bankRoutes, bankWeights, scoreBankRoute } from '../src/bank-trajectories'

test('same final balances, different movement and returns', () => {
  const ends = bankRoutes.map(r => scoreBankRoute(r.actions, bankWeights).at(-1)!)
  for (const end of ends) expect(end).toMatchObject({ savings: 300000, checking: 175000, complete: true })
  expect(ends.map(e => e.total)).toEqual([8.5, 6, 7])
  expect(ends.map(e => e.moved)).toEqual([50000, 150000, 50000])
})
test('outcome-only rewards tie and partial execution does not get completion reward', () => {
  for (const route of bankRoutes) {
    const steps = scoreBankRoute(route.actions, { completion: 10, call: 0, excess: 0 })
    expect(steps.at(-1)?.total).toBe(10)
    expect(steps.slice(0, -1).every(step => step.reward === 0)).toBe(true)
  }
})
