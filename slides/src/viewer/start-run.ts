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
