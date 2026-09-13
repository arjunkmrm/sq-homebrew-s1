import { loadRuns, type LogEvent, type ViewRun } from './load-run'

export const RECORDED_RUN_URL = '/runs/task-093-recorded.json'

export type RecordedRun = { run: ViewRun; agentModel?: string; recordedAt?: string; provenance?: string }

// loadRuns keeps only the fields the viewers read, so the provenance is parsed alongside it.
export async function fetchRecordedRun(url = RECORDED_RUN_URL, request: typeof fetch = fetch): Promise<RecordedRun> {
  const response = await request(url, { headers: { Accept: 'application/json' } })
  if (!response.ok) throw new Error('The recorded run could not be loaded.')
  const text = await response.text()
  const run = loadRuns(text)[0]
  if (!run) throw new Error('The recorded run file contained no run.')
  const value = JSON.parse(text) as { recorded?: { agentModel?: string; at?: string }; provenance?: string }
  return { run, agentModel: value.recorded?.agentModel, recordedAt: value.recorded?.at, provenance: value.provenance }
}

export type ReplayOptions = { totalMs?: number; minStepMs?: number; maxStepMs?: number; signal?: AbortSignal; wait?: (ms: number) => Promise<void> }

// Keeps the shape of the real pauses while fitting the whole run into totalMs, so a reader
// watching the replay does not sit through the model's actual latency.
export function replayDelays(events: LogEvent[], { totalMs = 11_000, minStepMs = 40, maxStepMs = 420 }: ReplayOptions = {}): number[] {
  const times = events.map(event => typeof event.at === 'number' ? event.at : null)
  const known = times.filter((time): time is number => time !== null)
  const span = known.length > 1 ? known[known.length - 1] - known[0] : 0
  const scale = span > 0 ? totalMs / span : 0
  let previous: number | null = null
  return events.map((event, index) => {
    const at = times[index]
    const gap = at !== null && previous !== null ? (at - previous) * scale : null
    if (at !== null) previous = at
    if (index === 0) return 0
    return gap === null ? minStepMs : Math.min(maxStepMs, Math.max(minStepMs, gap))
  })
}

// Resolves true when every event was emitted, false when the signal cut the replay short.
export async function replayRun(events: LogEvent[], onEvent: (event: LogEvent) => void, options: ReplayOptions = {}): Promise<boolean> {
  const delays = replayDelays(events, options)
  const wait = options.wait ?? ((ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms)))
  for (const [index, event] of events.entries()) {
    if (delays[index] > 0) await wait(delays[index])
    if (options.signal?.aborted) return false
    onEvent(event)
  }
  return true
}
