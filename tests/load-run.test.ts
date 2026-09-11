import { describe, expect, test } from 'bun:test'
import { loadRuns } from '../src/viewer/load-run'

const events = [{ type: 'ToolCalled', callId: 'call-1', name: 'list_accounts', arguments: {} }, { type: 'ToolReturned', callId: 'call-1', result: [] }]
describe('event viewer imports', () => {
  test('loads a case with snapshots and preserves event order', () => {
    const run = { id: 'balance', events, stateBefore: { accounts: [] }, stateAfter: { accounts: [] }, finalAnswer: 'Done' }
    expect(loadRuns(JSON.stringify(run))[0]).toMatchObject(run)
  })
  test('loads every case in a runner summary, including failed runs', () => {
    const cases = [{ id: 'first', events }, { id: 'failed', events: [], error: { stage: 'agent', message: 'Timeout' } }]
    expect(loadRuns(JSON.stringify({ cases }))).toMatchObject(cases)
  })
  test('loads raw events and legacy trajectory arrays', () => {
    expect(loadRuns(JSON.stringify(events))[0]?.events).toEqual(events)
    expect(loadRuns(JSON.stringify({ trajectory: events }))[0]?.events).toEqual(events)
  })
  test('rejects malformed files and does not mistake a projected trajectory for raw events', () => {
    for (const value of ['oops', 'null', '{"cases":[]}', '[{}]', '{"trajectory":{"tools":[],"messages":[]}}']) {
      expect(() => loadRuns(value)).toThrow()
    }
  })
})
