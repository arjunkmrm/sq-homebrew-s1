export type LogEvent = { type: string; [key: string]: unknown }
export type ViewRun = {
  id: string
  request?: string
  events: LogEvent[]
  stateBefore?: unknown
  stateAfter?: unknown
  finalAnswer?: string
  error?: unknown
}
const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)
const eventsOf = (value: unknown): LogEvent[] => {
  if (!Array.isArray(value) || !value.every(event => record(event) && typeof event.type === 'string')) {
    throw new Error('Expected an events array containing objects with a type field.')
  }
  return value as LogEvent[]
}
function runOf(value: unknown, index: number): ViewRun {
  if (!record(value)) throw new Error('Expected a saved run object.')
  return {
    id: typeof value.id === 'string' ? value.id : `Run ${index + 1}`,
    request: typeof value.request === 'string' ? value.request : undefined,
    events: eventsOf(value.events ?? (Array.isArray(value.trajectory) ? value.trajectory : undefined)),
    stateBefore: value.stateBefore,
    stateAfter: value.stateAfter,
    finalAnswer: typeof value.finalAnswer === 'string' ? value.finalAnswer : undefined,
    error: value.error,
  }
}
export function loadRuns(text: string): ViewRun[] {
  let value: unknown
  try { value = JSON.parse(text) } catch { throw new Error('This file is not valid JSON.') }
  if (Array.isArray(value)) return [{ id: 'Event log', events: eventsOf(value) }]
  if (record(value) && Array.isArray(value.cases)) {
    if (!value.cases.length) throw new Error('This summary contains no runs.')
    return value.cases.map(runOf)
  }
  return [runOf(value, 0)]
}
