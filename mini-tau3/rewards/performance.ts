export type RunEvent = { type: string; [key: string]: unknown }

const record = (value: unknown): Record<string, unknown> | undefined =>
  typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : undefined
const count = (value: unknown): number | null => typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null
const sum = (values: Array<number | null>): number | null =>
  values.length > 0 && values.every((value): value is number => value !== null) ? values.reduce((total, value) => total + value, 0) : null

export function measureRunPerformance(events: RunEvent[]) {
  const responses = new Map<string, Record<string, unknown>>()
  for (const event of events) {
    if (event.type !== "ModelReturned") continue
    const callId = typeof event.callId === "string" ? event.callId : undefined
    if (callId && !responses.has(callId)) responses.set(callId, event)
  }
  const usages = [...responses.values()].map(event => {
    const usage = record(event.usage)
    const promptTokens = count(usage?.promptTokens), completionTokens = count(usage?.completionTokens)
    return {
      promptTokens,
      completionTokens,
      totalTokens: count(usage?.totalTokens) ?? (promptTokens === null || completionTokens === null ? null : promptTokens + completionTokens),
      costUsd: count(usage?.costUsd),
    }
  })
  const first = events.find(event => event.type === "MessageReceived"), last = [...events].reverse().find(event => event.type === "TurnCompleted" || event.type === "TurnFailed")
  const start = first && count(first.at), end = last && count(last.at)
  return {
    durationMs: start != null && end != null && end >= start ? end - start : null,
    promptTokens: sum(usages.map(usage => usage.promptTokens)),
    completionTokens: sum(usages.map(usage => usage.completionTokens)),
    totalTokens: sum(usages.map(usage => usage.totalTokens)),
    costUsd: sum(usages.map(usage => usage.costUsd)),
  }
}
