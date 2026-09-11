import { expect, test } from 'bun:test'
import { readRunStream, type RunUpdate } from '../src/viewer/run-stream'

function response(text: string) {
  const bytes = new TextEncoder().encode(text)
  return new Response(new ReadableStream({ start(controller) {
    for (let index = 0; index < bytes.length; index += 3) controller.enqueue(bytes.slice(index, index + 3))
    controller.close()
  } }))
}

test('streams ordered events before the result across split JSON and Unicode', async () => {
  const event = { type: 'TextReturned', text: 'Transferred ✓' }
  const run = { id: 'transfer-between-own-accounts', events: [event] }
  const updates: RunUpdate[] = []
  const result = await readRunStream(response([
    { kind: 'status', message: 'Running' }, { kind: 'event', event }, { kind: 'result', run },
  ].map(value => JSON.stringify(value)).join('\n')), update => updates.push(update))
  expect(updates).toEqual([{ kind: 'status', message: 'Running' }, { kind: 'event', event }])
  expect(result.events).toEqual([event])
})

test('keeps partial updates but rejects a truncated or failed run', async () => {
  const updates: RunUpdate[] = []
  await expect(readRunStream(response('{"kind":"event","event":{"type":"ModelCalled"}}\n'), update => updates.push(update))).rejects.toThrow('before the final run')
  expect(updates).toHaveLength(1)
  await expect(readRunStream(response('{"kind":"error","error":"Gateway unavailable"}'), () => {})).rejects.toThrow('Gateway unavailable')
})
