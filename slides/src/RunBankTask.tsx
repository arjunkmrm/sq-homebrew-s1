import { useEffect, useRef, useState } from 'react'
import { type LogEvent, type ViewRun } from './viewer/load-run'
import { fetchRecordedRun, replayRun, type RecordedRun } from './viewer/replay-run'
import { ChatTranscript } from './viewer/ChatTranscript'
import { BaselineCode } from './viewer/BaselineCode'
import { EventLog } from '../../workshop/mini-tau3/inspector/EventLog'
import { measureRunPerformance } from '../../workshop/mini-tau3/rewards/performance'

const modelNames: Record<string, string> = {
  'openrouter:openai/gpt-5.6-terra': 'GPT-5.6 Terra',
  'openrouter:anthropic/claude-haiku-4.5': 'Claude Haiku 4.5',
  'openrouter:anthropic/claude-sonnet-4.6': 'Claude Sonnet 4.6',
}
const duration = (milliseconds?: number | null) => milliseconds == null ? '—' : `${(milliseconds / 1000).toFixed(1)}s`
const number = (value?: number | null) => value == null ? '—' : value.toLocaleString('en-US')
const modelLabel = (id?: string) => id ? modelNames[id] ?? id : '—'
const recordedDay = (at?: string) => {
  const date = at ? new Date(at) : undefined
  return date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : undefined
}

// These slides ship as static files and never call a model: the run below was recorded with the
// workshop CLI and is replayed from its saved log. Live runs live in the CLI itself.
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
  const [events, setEvents] = useState<LogEvent[]>([])
  const [status, setStatus] = useState('Loading the recorded run…')
  const [view, setView] = useState<'chat' | 'events' | 'code'>('chat')
  const [recorded, setRecorded] = useState<RecordedRun>()
  const skip = useRef<AbortController | undefined>(undefined)
  const list = useRef<HTMLDivElement>(null)
  const follow = useRef(true)
  const measured = run ? measureRunPerformance(run.events) : undefined
  useEffect(() => {
    let cancelled = false
    void fetchRecordedRun()
      .then(value => { if (!cancelled) { setRecorded(value); setStatus('Ready to play') } })
      .catch(() => { if (!cancelled) { setError('The recorded run could not be loaded.'); setStatus('Recorded run unavailable') } })
    return () => { cancelled = true }
  }, [])
  useEffect(() => {
    if (view !== 'code' && follow.current && list.current) list.current.scrollTop = list.current.scrollHeight
  }, [events.length, status, view])
  async function play() {
    setBusy(true); setError(''); setEvents([]); setStatus('Playing the recorded run…'); follow.current = true
    const controller = new AbortController()
    skip.current = controller
    try {
      const saved = recorded ?? await fetchRecordedRun()
      setRecorded(saved)
      const finished = await replayRun(saved.run.events, event => setEvents(current => [...current, event]), { signal: controller.signal })
      setEvents(saved.run.events); onRun(saved.run); setStatus(finished ? 'Playback complete' : 'Skipped to the end')
    } catch (error) { setError(error instanceof Error ? error.message : 'Could not play the recorded run.'); setStatus('Playback interrupted') }
    finally { skip.current = undefined; setBusy(false) }
  }
  const day = recordedDay(recorded?.recordedAt)
  return <section className="live-run-slide">
    <h2>a recorded <span className="accent">agent run</span></h2>
    <div className="live-run-body"><div className="live-run-controls">
      <p className="live-task-id">TASK 093 · SOMCHAI PRASERT<span className="live-recorded-chip">PRELOADED</span></p>
      <blockquote className="live-customer-opening">“Hi, I think there might be something wrong with my interest payments…”</blockquote>
      <div className="live-setup">
        <div><small>AGENT</small><p>Baseline actor</p></div>
        <div><small>CUSTOMER</small><p>Simulated conversation</p></div>
        <div><small>MODEL</small><p>{modelLabel(recorded?.agentModel)}</p></div>
      </div>
      <div className="live-actions">
        <button data-run-task093 disabled={busy || !recorded} onClick={() => void play()}>{busy ? 'Playing…' : 'Play recorded run →'}</button>
        {busy && <button className="live-secondary" onClick={() => skip.current?.abort()}>Skip to end</button>}
      </div>
      <p className="live-recorded-note">This page never calls a model. It plays back a run recorded with the workshop CLI{day ? ` on ${day}` : ''}, so every event, timing, token count and cost is from that run. Run your own with the command below.</p>
      <p className="live-cli-command"><code>bun run cli run --cases task_093</code></p>
      <div className="live-status" aria-live="polite">
        {busy ? <p>{status}</p> : error ? <p className="scorer-error" role="alert">{error}</p> : run ? <><div className="live-run-summary"><div><span>OUTCOME</span><strong>{run.outcome?.pass ? 'pass' : run.error !== undefined ? 'error' : 'fail'}</strong></div><div><span>TOOLS</span><strong>{run.score?.toolCalls ?? run.events.filter(event => event.type === 'ToolCalled').length}</strong></div><div><span>DURATION</span><strong>{duration(run.score?.durationMs ?? measured?.durationMs)}</strong></div><div><span>AGENT TOKENS</span><strong>{number(run.score?.totalTokens ?? measured?.totalTokens)}</strong></div><div><span>AGENT COST</span><strong>{measured?.costUsd == null ? '—' : `$${measured.costUsd.toFixed(3)}`}</strong></div></div>{run.error !== undefined && <p className="scorer-error">The run recorded an error. Inspect its Events view.</p>}<a href="#21">Write the reward function →</a></> : <p>Play the baseline agent working task 093 against a fresh bank and a simulated customer.</p>}
      </div>
    </div><section className="live-log" aria-label="Recorded agent run">
      <header><nav className="live-view-toggle" aria-label="Run view"><button aria-pressed={view === 'chat'} onClick={() => { follow.current = true; setView('chat') }}>Chat</button><button aria-pressed={view === 'events'} onClick={() => { follow.current = true; setView('events') }}>Events</button><button aria-pressed={view === 'code'} onClick={() => { follow.current = false; setView('code'); if (list.current) list.current.scrollTop = 0 }}>Code</button></nav><span>{busy ? `● PLAYBACK · ${Math.floor(elapsedSeconds / 60)}:${String(elapsedSeconds % 60).padStart(2, '0')}` : `${events.length} events`}</span></header>
      <div className="live-log-scroll" ref={list} onScroll={() => { const el = list.current; if (el) follow.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60 }}>
        {view === 'code' ? <BaselineCode /> : view === 'chat' ? <ChatTranscript events={events} busy={busy} customerTurns={!busy ? run?.customerTurns : undefined} empty="Play the recorded run to see the conversation." /> : <>
          <EventLog events={events} empty={busy ? 'Waiting for the first event…' : 'Events play back here from the recorded run.'} />
        </>}
      </div>
      <footer>{status} · Recorded task_093</footer>
    </section></div>
  </section>
}
