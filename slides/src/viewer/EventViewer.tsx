import { useEffect, useMemo, useState } from 'react'
import { loadRuns, type ViewRun, type LogEvent } from './load-run'
import { trajectoryProjection } from '../../../workshop/mini-tau3/trajectory'
import type { Event } from 'tardie/core/event'
import './viewer.css'

const json = (value: unknown) => JSON.stringify(value, null, 2) ?? 'Not recorded.'
const preview = (event: LogEvent) => {
  const value = event.text ?? event.name ?? event.output ?? event.error ?? event.result ?? event.callId ?? ''
  return (typeof value === 'string' ? value : JSON.stringify(value)).slice(0, 130)
}

export function EventViewer({ embedded = false, initialRun, onRunChange }: { embedded?: boolean; initialRun?: ViewRun; onRunChange?: (run: ViewRun) => void }) {
  const [runs, setRuns] = useState<ViewRun[]>([])
  const [runIndex, setRunIndex] = useState(0)
  const [selected, setSelected] = useState(0)
  const [tab, setTab] = useState<'events' | 'trajectory' | 'state'>('events')
  const [error, setError] = useState('')
  const [filename, setFilename] = useState('')
  const run = runs[runIndex]
  useEffect(() => {
    if (initialRun) { setRuns([initialRun]); setRunIndex(0); setSelected(0); setFilename('Workshop run') }
  }, [initialRun])
  const projected = useMemo(() => {
    if (!run) return null
    let state = trajectoryProjection.initial()
    for (const event of run.events) state = trajectoryProjection.step(state, event as Event)
    return trajectoryProjection.output(state)
  }, [run])
  async function open(file?: File) {
    if (!file) return
    try {
      const next = loadRuns(await file.text())
      setRuns(next); setRunIndex(0); setSelected(0); setTab('events'); setFilename(file.name); setError('')
      if (next[0]) onRunChange?.(next[0])
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not read the file.') }
  }
  async function openRecordedRun() {
    try {
      const response = await fetch('/runs/first-transfer.json')
      if (!response.ok) throw new Error('Could not load the recorded run.')
      await open(new File([await response.text()], 'first-transfer.json', { type: 'application/json' }))
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not load the recorded run.') }
  }
  const Container = embedded ? 'div' : 'main'
  return <Container className={`event-viewer${embedded ? ' embedded-viewer' : ''}`}>
    <header className="viewer-header">
      <div>{!embedded && <a href="/#14">← Workshop</a>}{!embedded && <h1>execution log</h1>}</div>
      <label className="viewer-open">Open JSON<input type="file" accept=".json,application/json" onChange={e => { void open(e.target.files?.[0]); e.target.value = '' }} /></label>
    </header>
    {error && <p role="alert" className="viewer-error">{error}</p>}
    {!run ? <section className="viewer-empty">
      <h2>A run, one event at a time.</h2>
      <p>Open a case JSON, summary.json, or an array of raw events.</p>
      <button className="viewer-recorded" onClick={() => void openRecordedRun()}>Open recorded $500 transfer →</button>
      <p>Files are read in your browser. Nothing is uploaded.</p>
      <code>mini-tau3/runs/&lt;run&gt;/&lt;case&gt;.json</code>
    </section> : <>
      <div className="viewer-run-heading">
        <label>Run <select value={runIndex} onChange={e => { const index = Number(e.target.value); setRunIndex(index); setSelected(0); onRunChange?.(runs[index]!) }}>{runs.map((r, i) => <option key={i} value={i}>{r.id}</option>)}</select></label>
        <span>{filename} · {run.events.length} events</span>
      </div>
      {run.request && <p className="viewer-request">{run.request}</p>}
      {!embedded && run.id === 'transfer-between-own-accounts' && <p><a href="/rewards">Score transfer runs →</a></p>}
      {run.error !== undefined && <details className="viewer-run-error"><summary>Run error</summary><pre>{json(run.error)}</pre></details>}
      <nav className="viewer-tabs" aria-label="Log views">
        {(['events', 'trajectory', 'state'] as const).map(view => <button key={view} aria-pressed={tab === view} onClick={() => setTab(view)}>{view === 'events' ? 'Raw events' : view === 'trajectory' ? 'Projected trajectory' : 'State'}</button>)}
      </nav>
      {tab === 'events' ? <div className="viewer-events">
        <ol className="viewer-timeline" aria-label="Events in recorded order">
          {run.events.map((event, i) => <li key={i}><button aria-current={selected === i ? 'true' : undefined} onClick={() => setSelected(i)}>
            <span className="event-index">{String(i).padStart(3, '0')}</span><span><strong>{event.type}</strong><small>{preview(event)}</small></span>
          </button></li>)}
          {!run.events.length && <li className="viewer-no-events">No events recorded.</li>}
        </ol>
        <section className="viewer-detail" aria-label="Selected event details">
          {run.events[selected] ? <><h2>{run.events[selected]!.type}</h2><p>Log position {selected}</p><pre>{json(run.events[selected])}</pre></> : <p>No event to inspect.</p>}
        </section>
      </div> : tab === 'trajectory' ? <section className="viewer-projection"><p>Derived from the raw log using <code>trajectoryProjection</code>.</p><pre>{json(projected)}</pre></section> : <section className="viewer-states">
        <div><h2>Before</h2><pre>{json(run.stateBefore)}</pre></div><div><h2>After</h2><pre>{json(run.stateAfter)}</pre></div>
      </section>}
      {run.finalAnswer && <details className="viewer-answer"><summary>Final answer</summary><p>{run.finalAnswer}</p></details>}
    </>}
  </Container>
}
