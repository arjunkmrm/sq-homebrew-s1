import { useEffect, useRef, useState } from 'react'
import { type LogEvent, type ViewRun } from './viewer/load-run'
import { readRunStream } from './viewer/run-stream'
import { startRun } from './viewer/start-run'
import { ChatTranscript } from './viewer/ChatTranscript'
import { BaselineCode } from './viewer/BaselineCode'
import { RunPicker } from './viewer/RunPicker'
import { EventLog } from '../../workshop/mini-tau3/inspector/EventLog'
import { measureRunPerformance } from '../../workshop/mini-tau3/rewards/performance'

const models = [
  { id: '', label: 'Configured default' },
  { id: 'openrouter:openai/gpt-5.6-terra', label: 'GPT-5.6 Terra' },
  { id: 'openrouter:anthropic/claude-haiku-4.5', label: 'Claude Haiku 4.5' },
  { id: 'openrouter:anthropic/claude-sonnet-4.6', label: 'Claude Sonnet 4.6' },
]
const duration = (milliseconds?: number | null) => milliseconds == null ? '—' : `${(milliseconds / 1000).toFixed(1)}s`
const number = (value?: number | null) => value == null ? '—' : value.toLocaleString('en-US')

export function RunBankTask({ run, onRun }: { run?: ViewRun; onRun: (run: ViewRun) => void }) {
  const [busy, setBusy] = useState(false)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  useEffect(() => {
    if (!busy) return
    const started = performance.now()
    setElapsedSeconds(0)
    const timer = window.setInterval(() => setElapsedSeconds(Math.floor((performance.now() - started) / 1000)), 250)
    return () => window.clearInterval(timer)
  }, [busy])
  const [error, setError] = useState('')
  const [origin, setOrigin] = useState('')
  const [events, setEvents] = useState<LogEvent[]>([])
  const [status, setStatus] = useState('Ready to run')
  const [view, setView] = useState<'chat' | 'events' | 'code'>('chat')
  const [model, setModel] = useState('')
  const list = useRef<HTMLDivElement>(null)
  const follow = useRef(true)
  const measured = run ? measureRunPerformance(run.events) : undefined
  useEffect(() => {
    if (view !== 'code' && follow.current && list.current) list.current.scrollTop = list.current.scrollHeight
  }, [events.length, status, view])
  async function execute() {
    setBusy(true); setError(''); setEvents([]); setOrigin('Live task_093'); setStatus('Starting agent and simulated customer…'); follow.current = true
    try {
      const query = new URLSearchParams({ case: 'task_093' })
      if (model) query.set('model', model)
      const response = await startRun(`/api/banking-run?${query}`, () => setStatus('Waiting for a free slot…'))
      if (!response.ok) {
        const detail = await response.json().catch(() => null)
        throw new Error(detail?.error ?? 'Could not start the run. Use the local workshop dev server for live runs.')
      }
      const next = await readRunStream(response, update => {
        if (update.kind === 'status') setStatus(update.message)
        else setEvents(current => [...current, update.event])
      })
      if (!next) throw new Error('The runner returned no log.')
      setEvents(next.events); onRun(next); setStatus(next.error !== undefined ? 'Run finished with an error' : 'Run complete')
    } catch (error) { setError(error instanceof Error ? error.message : 'Could not run task.'); setStatus('Run interrupted') }
    finally { setBusy(false) }
  }
  return <section className="live-run-slide">
    <h2>run the <span className="accent">banking agent</span></h2>
    <div className="live-run-body"><div className="live-run-controls">
      <p className="live-task-id">TASK 093 · SOMCHAI PRASERT</p>
      <blockquote className="live-customer-opening">“Hi, I think there might be something wrong with my interest payments…”</blockquote>
      <div className="live-setup"><div><small>AGENT</small><p>Baseline actor</p></div><div><small>CUSTOMER</small><p>Simulated conversation</p></div></div>
      <div className="live-model"><span>MODEL</span><RunPicker value={model} options={models.map(option => ({ value: option.id, label: option.label }))} onChange={setModel} disabled={busy} ariaLabel="Choose model" /></div>
      <div className="live-actions"><button data-run-task093 disabled={busy} onClick={() => void execute()}>{busy ? 'Running task 093…' : 'Run task 093 →'}</button></div>
      <p className="live-cli-command"><code>bun run cli run --cases task_093{model ? ` --agent-model ${model}` : ''}</code></p>
      <div className="live-status" aria-live="polite">
        {busy ? <p>{status}</p> : error ? <p className="scorer-error" role="alert">{error}</p> : run ? <><div className="live-run-summary"><div><span>OUTCOME</span><strong>{run.outcome?.pass ? 'pass' : run.error !== undefined ? 'error' : 'fail'}</strong></div><div><span>TOOLS</span><strong>{run.score?.toolCalls ?? run.events.filter(event => event.type === 'ToolCalled').length}</strong></div><div><span>DURATION</span><strong>{duration(run.score?.durationMs ?? measured?.durationMs)}</strong></div><div><span>AGENT TOKENS</span><strong>{number(run.score?.totalTokens ?? measured?.totalTokens)}</strong></div><div><span>AGENT COST</span><strong>{measured?.costUsd == null ? '—' : `$${measured.costUsd.toFixed(3)}`}</strong></div></div>{run.error !== undefined && <p className="scorer-error">The run recorded an error. Inspect its Events view.</p>}<a href="#21">Write the reward function →</a></> : <p>Run the baseline agent against a fresh task 093 bank and simulated customer.</p>}
      </div>
    </div><section className="live-log" aria-label="Live agent run">
      <header><nav className="live-view-toggle" aria-label="Run view"><button aria-pressed={view === 'chat'} onClick={() => { follow.current = true; setView('chat') }}>Chat</button><button aria-pressed={view === 'events'} onClick={() => { follow.current = true; setView('events') }}>Events</button><button aria-pressed={view === 'code'} onClick={() => { follow.current = false; setView('code'); if (list.current) list.current.scrollTop = 0 }}>Code</button></nav><span>{busy ? `● LIVE · ${Math.floor(elapsedSeconds / 60)}:${String(elapsedSeconds % 60).padStart(2, '0')}` : `${events.length} events`}</span></header>
      <div className="live-log-scroll" ref={list} onScroll={() => { const el = list.current; if (el) follow.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60 }}>
        {view === 'code' ? <BaselineCode /> : view === 'chat' ? <ChatTranscript events={events} busy={busy} customerTurns={!busy ? run?.customerTurns : undefined} /> : <>
          <EventLog events={events} empty={busy ? 'Waiting for the first event…' : 'Events will appear here as the agent runs.'} />
        </>}
      </div>
      <footer>{status}{origin && ` · ${origin}`}</footer>
    </section></div>
  </section>
}
