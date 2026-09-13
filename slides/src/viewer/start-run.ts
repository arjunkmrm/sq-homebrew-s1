type Options = {
  fetch?: typeof fetch
  wait?: () => Promise<void>
  maxRetries?: number
}

// A busy server has not started this run, so retrying 409 is safe.
// Never retry an accepted stream or another HTTP failure.
export async function startRun(url: string, onQueued: () => void, options: Options = {}): Promise<Response> {
  const request = options.fetch ?? fetch
  const wait = options.wait ?? (() => new Promise<void>(resolve => setTimeout(resolve, 1500)))
  const maxRetries = options.maxRetries ?? 200
  for (let attempt = 0; ; attempt++) {
    const response = await request(url, { method: 'POST', headers: { Accept: 'application/x-ndjson' } })
    if (response.status !== 409) return response
    await response.body?.cancel()
    if (attempt >= maxRetries) throw new Error('Still waiting for a free run slot. Please try again.')
    onQueued()
    await wait()
  }
}

// A static deployment has no runner endpoint, and some hosts answer unknown paths with the
// app shell, so the runner counts as live only when the models endpoint returns real JSON.
export async function probeLiveRunner(request: typeof fetch = fetch): Promise<boolean> {
  try {
    const response = await request('/api/banking-models', { headers: { Accept: 'application/json' } })
    if (!response.ok) return false
    const value = await response.json() as { models?: unknown }
    return Array.isArray(value.models)
  } catch {
    return false
  }
}
