import { useEffect, useState } from 'react'
import { EventLog } from './EventLog'
import { loadRuns, type ViewRun } from './load-run'
import './inspector.css'

type Leader = { agent: string; agentFile: string; rank: number; averageReward: number | null; successful: number; trials: number }
type Challenge = { runId: string; leaderboard: Leader[] }
const label = (run: ViewRun) => [run.agent, run.id, run.trial ? `trial ${run.trial}` : ''].filter(Boolean).join(' · ')

export function App() {
  const [title, setTitle] = useState('')
  const [runs, setRuns] = useState<ViewRun[]>([])
  const [challenge, setChallenge] = useState<Challenge>()
  const [selected, setSelected] = useState(0)
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')

  function load(text: string, filename: string) {
    const next = loadRuns(text)
    const value = JSON.parse(text)
    setRuns(next)
    setTitle(filename)
    setSelected(0)
    setQuery('')
    setError('')
    setChallenge(value?.kind === 'challenge' && typeof value.runId === 'string' && Array.isArray(value.leaderboard)
      ? { runId: value.runId, leaderboard: value.leaderboard } : undefined)
  }

  useEffect(() => {
    void fetch('/run.json').then(async response => {
      if (!response.ok) throw new Error('Could not load the JSON file.')
      const payload = await response.json()
      load(JSON.stringify(payload.document), payload.title ?? 'run.json')
    }).catch(cause => setError(cause instanceof Error ? cause.message : 'Could not load the run.'))
  }, [])

  async function openFile(file?: File) {
    if (!file) return
    try { load(await file.text(), file.name) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not open the file.') }
  }

  const run = runs[selected]
  return <main className="inspector-shell">
    <header className="inspector-toolbar">
      <p className="inspector-meta">{challenge?.runId ?? title}</p>
      <div className="inspector-actions">
        <label className="inspector-open">Open JSON<input type="file" accept=".json,application/json" onChange={event => { void openFile(event.target.files?.[0]); event.target.value = '' }} /></label>
      </div>
    </header>
    {error && <p className="inspector-error" role="alert">{error}</p>}
    {challenge && <div className="inspector-leaderboard">
      <table aria-label="Challenge leaderboard">
        <thead><tr><th>Rank</th><th>Agent</th><th>Average reward</th><th>Completed</th></tr></thead>
        <tbody>{challenge.leaderboard.map(item => <tr key={item.agentFile}>
          <td>{item.rank}</td><td>{item.agent}</td>
          <td>{typeof item.averageReward === 'number' ? item.averageReward.toFixed(2) : '—'}</td>
          <td>{item.successful} / {item.trials}</td>
        </tr>)}</tbody>
      </table>
    </div>}
    {run ? <>
      <div className="inspector-toolbar">
        <div className="inspector-actions">
          {runs.length > 1 ? <label>Run<select value={selected} onChange={event => { setSelected(Number(event.target.value)); setQuery('') }}>
            {runs.map((item, index) => <option value={index} key={item.attemptId ?? index}>{label(item)}</option>)}
          </select></label> : <p className="inspector-meta">{label(run)}</p>}
        </div>
        <div className="inspector-actions"><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Filter events…" aria-label="Filter events" /></div>
      </div>
      <p className="inspector-run-meta">{run.events.length} events{run.score && ` · Reward ${run.score.total?.toFixed(2) ?? '—'} · Completed ${run.score.completed ? 'yes' : 'no'}`}{run.logFile && ` · ${run.logFile}`}</p>
      {run.error !== undefined && <p className="inspector-error" role="alert">{typeof run.error === 'string' ? run.error : JSON.stringify(run.error)}</p>}
      <section className="inspector-log" aria-label="Run events"><EventLog key={selected} events={run.events} query={query} empty={query ? 'No matching events.' : 'No events recorded.'} /></section>
    </> : !error && <p className="inspector-meta">Loading…</p>}
  </main>
}
