import { useEffect, useRef, useState } from 'react'
import { loadRuns, type LogEvent, type ViewRun } from './viewer/load-run'
import { readRunStream } from './viewer/run-stream'
import { startRun } from './viewer/start-run'
import { ChatTranscript } from './viewer/ChatTranscript'
import { BaselineCode } from './viewer/BaselineCode'

function preview(event: LogEvent): string {
  const value = event.name ?? event.text ?? event.output ?? event.result ?? event.error ?? event.model ?? ''
  return (typeof value === 'string' ? value : JSON.stringify(value)).slice(0, 180)
}

export function RunBankTask({ run, onRun }: { run?: ViewRun; onRun: (run: ViewRun) => void }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [origin, setOrigin] = useState('')
  const [events, setEvents] = useState<LogEvent[]>([])
  const [status, setStatus] = useState('Ready to run')
  const [view, setView] = useState<'chat' | 'events' | 'code'>('chat')
  const list = useRef<HTMLDivElement>(null)
  const follow = useRef(true)
  useEffect(() => {
    if (view !== 'code' && follow.current && list.current) list.current.scrollTop = list.current.scrollHeight
  }, [events.length, status, view])
  async function execute(recorded: boolean) {
    setBusy(true); setError(''); setEvents([]); setOrigin(recorded ? 'Recorded baseline' : 'Live run'); setStatus(recorded ? 'Loading recorded log…' : 'Starting agent…'); follow.current = true
    try {
      const response = recorded ? await fetch('/runs/first-transfer.json') : await startRun('/api/banking-run', () => setStatus('Waiting for a free slot…'))
      if (!response.ok) {
        const detail = await response.json().catch(() => null)
        throw new Error(detail?.error ?? 'Could not start the run. Use the local workshop dev server for live runs.')
      }
      const next = recorded ? loadRuns(await response.text())[0] : await readRunStream(response, update => {
        if (update.kind === 'status') setStatus(update.message)
        else setEvents(current => [...current, update.event])
      })
      if (!next) throw new Error('The runner returned no log.')
      setEvents(next.events); onRun(next); setStatus(next.error !== undefined ? 'Run finished with an error' : 'Run complete')
    } catch (error) { setError(error instanceof Error ? error.message : 'Could not run task.'); setStatus('Run interrupted') }
    finally { setBusy(false) }
  }
  return <section className="live-run-slide">
    <h2>make a <span className="accent">real run</span></h2>
    <div className="live-run-body"><div className="live-run-controls">
      <p className="live-task">“Move $500 from my savings to my checking.”</p>
      <div className="live-setup"><div><small>AGENT</small><p>Tardie · baseline</p></div><div><small>ENVIRONMENT</small><p>Fresh bank state</p></div></div>
      <div className="live-actions"><button disabled={busy} onClick={() => void execute(false)}>{busy ? 'Running…' : 'Run agent →'}</button><button disabled={busy} className="live-secondary" onClick={() => void execute(true)}>Use recorded baseline</button></div>
      <div className="live-status" aria-live="polite">
        {busy ? <p>{status}</p> : error ? <p className="scorer-error" role="alert">{error}</p> : run ? <><p>{origin} · {run.events.length} events · {run.events.filter(event => event.type === 'ToolCalled').length} tool calls</p>{run.error !== undefined && <p className="scorer-error">The run recorded an error. Inspect its Events view.</p>}<a href="#15">Write the reward function →</a></> : <p>Watch model requests, tool calls, and results arrive.</p>}
      </div>
    </div><section className="live-log" aria-label="Live agent run">
      <header><nav className="live-view-toggle" aria-label="Run view"><button aria-pressed={view === 'chat'} onClick={() => { follow.current = true; setView('chat') }}>Chat</button><button aria-pressed={view === 'events'} onClick={() => { follow.current = true; setView('events') }}>Events</button><button aria-pressed={view === 'code'} onClick={() => { follow.current = false; setView('code'); if (list.current) list.current.scrollTop = 0 }}>Code</button></nav><span>{busy ? origin === 'Recorded baseline' ? 'LOADING' : '● LIVE' : origin === 'Recorded baseline' ? 'RECORDED' : `${events.length} events`}</span></header>
      <div className="live-log-scroll" ref={list} onScroll={() => { const el = list.current; if (el) follow.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60 }}>
        {view === 'code' ? <BaselineCode /> : view === 'chat' ? <ChatTranscript events={events} busy={busy} /> : <>
          {!events.length && <p className="live-log-empty">{busy ? 'Waiting for the first event…' : 'Events will appear here as the agent runs.'}</p>}
          <ol>{events.map((event, index) => <li key={index}><details><summary><span className="live-log-index">{String(index + 1).padStart(2, '0')}</span><span><strong>{event.type}</strong><small>{preview(event)}</small></span></summary><pre>{JSON.stringify(event, null, 2)}</pre></details></li>)}</ol>
        </>}
      </div>
      <footer>{status}</footer>
    </section></div>
  </section>
}
