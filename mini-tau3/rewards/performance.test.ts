import { expect, test } from 'bun:test'
import { measureRunPerformance } from './efficient-run.ts'

test('multi-turn performance covers the entire conversation and deduplicates model calls', () => {
  const returned = { type: 'ModelReturned', callId: 'one', usage: { promptTokens: 100, completionTokens: 20, costUsd: .01 } }
  const metrics = measureRunPerformance([
    { type: 'MessageReceived', at: 1000 }, returned, returned,
    { type: 'TurnCompleted', at: 3000 },
    { type: 'MessageReceived', at: 4000 },
    { type: 'ModelReturned', callId: 'two', usage: { promptTokens: 200, completionTokens: 30, totalTokens: 230, costUsd: .02 } },
    { type: 'TurnCompleted', at: 6000 },
  ])
  expect(metrics.durationMs).toBe(5000)
  expect(metrics.totalTokens).toBe(350)
  expect(metrics.costUsd).toBeCloseTo(.03)
})

test('missing model usage remains unknown', () => {
  expect(measureRunPerformance([{ type: 'ModelReturned', callId: 'one' }]).totalTokens).toBeNull()
})
