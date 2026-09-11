import { expect, test } from 'bun:test'
import { startRun } from '../src/viewer/start-run'

test('waits for shared server capacity and starts only one accepted run', async () => {
  let requests = 0, waits = 0, queued = 0
  const request = (async () => new Response('', { status: ++requests <= 2 ? 409 : 200 })) as typeof fetch
  const response = await startRun('/api/banking-run', () => queued++, { fetch: request, wait: async () => { waits++ } })
  expect(response.status).toBe(200)
  expect([requests, waits, queued]).toEqual([3, 2, 2])
})

test('does not retry other failures or retry forever', async () => {
  let requests = 0
  const request = (async () => { requests++; return new Response('', { status: 500 }) }) as typeof fetch
  expect((await startRun('/', () => {}, { fetch: request })).status).toBe(500)
  expect(requests).toBe(1)
  await expect(startRun('/', () => {}, { fetch: (async () => new Response('', { status: 409 })) as typeof fetch, wait: async () => {}, maxRetries: 1 })).rejects.toThrow('free run slot')
})
