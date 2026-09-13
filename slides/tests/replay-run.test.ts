import { expect, test } from 'bun:test'
import { replayDelays, replayRun, fetchRecordedRun } from '../src/viewer/replay-run'

const events = [{ type: 'A', at: 1000 }, { type: 'B', at: 2000 }, { type: 'C', at: 41000 }]

test('compresses the recorded clock while keeping the shape of its pauses', () => {
  const delays = replayDelays(events, { totalMs: 4000, minStepMs: 10, maxStepMs: 1000 })
  expect(delays[0]).toBe(0)
  expect(delays[1]).toBeLessThan(delays[2])
  expect(delays.reduce((total, delay) => total + delay, 0)).toBeLessThanOrEqual(4000)
})

test('falls back to the minimum step when events carry no timestamp', () => {
  expect(replayDelays([{ type: 'A' }, { type: 'B' }], { minStepMs: 25 })).toEqual([0, 25])
})

test('emits every event in order and reports a signalled skip', async () => {
  const seen: string[] = []
  expect(await replayRun(events, event => seen.push(event.type), { wait: async () => {} })).toBe(true)
  expect(seen).toEqual(['A', 'B', 'C'])

  const controller = new AbortController()
  const skipped: string[] = []
  const finished = await replayRun(events, event => { skipped.push(event.type); controller.abort() }, { wait: async () => {}, signal: controller.signal })
  expect([finished, skipped]).toEqual([false, ['A']])
})

test('reads the run and its provenance from the saved log', async () => {
  const log = JSON.stringify({ id: 'task_093', events, recorded: { agentModel: 'openrouter:openai/gpt-5.6-terra', at: '2026-09-13T01:39:18.999Z' }, provenance: 'Real run.' })
  const request = (async () => new Response(log, { status: 200 })) as typeof fetch
  const recorded = await fetchRecordedRun('/runs/task-093-recorded.json', request)
  expect([recorded.run.id, recorded.run.events.length, recorded.agentModel, recorded.provenance]).toEqual(['task_093', 3, 'openrouter:openai/gpt-5.6-terra', 'Real run.'])
  await expect(fetchRecordedRun('/missing', (async () => new Response('', { status: 404 })) as typeof fetch)).rejects.toThrow('could not be loaded')
})
