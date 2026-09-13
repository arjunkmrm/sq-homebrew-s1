import { loadRuns, type LogEvent, type ViewRun } from './load-run'

export type RunUpdate = { kind: 'status'; message: string } | { kind: 'event'; event: LogEvent }

// Reads newline-delimited packets across arbitrary network chunk boundaries.
export async function readRunStream(response: Response, onUpdate: (update: RunUpdate) => void): Promise<ViewRun> {
  if (!response.body) throw new Error('The runner did not open an event stream.')
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let result: ViewRun | undefined
  function packet(line: string) {
    if (!line.trim()) return
    const value = JSON.parse(line)
    if (value.kind === 'error') throw new Error(typeof value.error === 'string' ? value.error : 'The run failed.')
    if (value.kind === 'result') {
      result = loadRuns(JSON.stringify(value.run))[0]
    } else if (value.kind === 'status' && typeof value.message === 'string') {
      onUpdate({ kind: 'status', message: value.message })
    } else if (value.kind === 'event' && value.event && typeof value.event.type === 'string') {
      onUpdate({ kind: 'event', event: value.event })
    } else throw new Error('The runner sent an invalid stream packet.')
  }
  try {
    while (true) {
      const { done, value } = await reader.read()
      buffer += decoder.decode(value, { stream: !done })
      let index: number
      while ((index = buffer.indexOf('\n')) !== -1) {
        packet(buffer.slice(0, index)); buffer = buffer.slice(index + 1)
      }
      if (done) break
    }
    if (buffer.trim()) packet(buffer)
    if (!result) throw new Error('The stream ended before the final run was received.')
    return result
  } catch (error) {
    await reader.cancel().catch(() => {})
    throw error
  } finally { reader.releaseLock() }
}
