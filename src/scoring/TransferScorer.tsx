import { useEffect, useMemo, useState } from 'react'
import { loadRuns, type ViewRun } from '../viewer/load-run'
import { scoreRun } from '../viewer/score-run'
import './scoring.css'
import rewardSource from '../../../workshop/mini-tau3/rewards/banking.ts?raw'
import { HighlightedCode } from '../viewer/HighlightedCode'
import { RunPicker } from '../viewer/RunPicker'
import { fetchRecordedRun } from '../viewer/replay-run'

type Entry = { key: number; label: string; run: ViewRun }
const RECORDED_LABEL = 'Recorded run · baseline'
const number = (value: number | null) => value === null ? '—' : Number(value.toFixed(3)).toString()
export function TransferScorer({ embedded = false, initialRun }: { embedded?: boolean; initialRun?: ViewRun }) {
  const [entries, setEntries] = useState<Entry[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [selected, setSelected] = useState(0)
  const [exampleLoading, setExampleLoading] = useState(false)
  const [provenance, setProvenance] = useState<string>()
  useEffect(() => {
    if (initialRun) { setEntries(current => [{ key: -1, label: 'Workshop run', run: initialRun }, ...current.filter(entry => entry.key !== -1)]); setSelected(0) }
  }, [initialRun])
  const scores = useMemo(() => entries.map(entry => {
    try { return { ...entry, score: scoreRun(entry.run), error: undefined } }
    catch (error) { return { ...entry, score: undefined, error: error instanceof Error ? error.message : 'Could not score this run.' } }
  }), [entries])
  async function addFiles(files: File[]) {
    const added: Omit<Entry, 'key'>[] = [], failures: string[] = []
    for (const file of files) {
      try { for (const run of loadRuns(await file.text())) added.push({ label: file.name, run }) }
      catch (error) { failures.push(`${file.name}: ${error instanceof Error ? error.message : 'Could not read file.'}`) }
    }
    setEntries(current => [...current, ...added.map((entry, index) => ({ ...entry, key: (current.at(-1)?.key ?? -1) + index + 1 }))])
    setErrors(failures)
  }
  async function loadExample() {
    setExampleLoading(true); setErrors([])
    try {
      const { run, provenance } = await fetchRecordedRun()
      setProvenance(provenance)
      setEntries(current => [...current.filter(item => item.label !== RECORDED_LABEL), { key: Date.now(), label: RECORDED_LABEL, run }])
      setSelected(entries.filter(item => item.label !== RECORDED_LABEL).length)
    } catch (error) { setErrors([error instanceof Error ? error.message : 'The recorded run could not be loaded.']) }
    finally { setExampleLoading(false) }
  }
  const entry = scores[Math.min(selected, scores.length - 1)]
  const Container = embedded ? 'div' : 'main'
  return <Container className={`transfer-scorer${embedded ? ' embedded-scorer' : ''}`}>
    {!embedded && <header className="scorer-header"><a href="/events">← Execution logs</a><a href="/#20">Reward function slide →</a></header>}
    {!embedded && <h1>score the <span className="accent">trajectory.</span></h1>}
    <div className="score-log-toolbar">
      {entries.length > 0 && <RunPicker value={String(Math.min(selected, entries.length - 1))} options={entries.map((item, index) => ({value: String(index), label: item.label}))} onChange={value => setSelected(Number(value))} ariaLabel="Select run to score" />}
      <div className="scorer-actions"><button type="button" className="scorer-example" disabled={exampleLoading} onClick={() => void loadExample()}>{exampleLoading ? 'Loading recorded run…' : 'Load recorded run'}</button><label className="scorer-upload">Add run logs<input type="file" accept=".json,application/json" multiple onChange={event => { void addFiles(Array.from(event.target.files ?? [])); event.target.value = '' }} /></label></div>
    </div>
    {entry?.label === RECORDED_LABEL && <p className="scorer-example-note">{provenance ?? 'Recorded run · real model call, replayed from a saved log'}</p>}
    {errors.map((error, index) => <p className="scorer-error" role="alert" key={index}>{error}</p>)}
    <div className="score-log-layout score-three-columns">
      <section className="score-event-panel">
        <header><h3>trajectory</h3><span>{entry?.run.events.length ?? 0} events</span></header>
        {entry?.run.request && <p className="score-log-request">{entry.run.request}</p>}
        <div className="score-event-scroll" key={entry?.key}>
          {!entry ? <div className="score-trajectory-placeholder"><p>Replay task 093 on slide 20 or load the recorded run.</p><div aria-hidden="true"><i /><i /><i /><i /><i /></div><small>customer → agent → tools → outcome</small></div> : !entry.run.events.length ? <p className="scorer-empty">No events recorded.</p> : <ol>{entry.run.events.map((event, index) => {
            const value = event.name ?? event.text ?? event.output ?? ''
            const preview = typeof value === 'string' ? value : JSON.stringify(value)
            return <li key={index}><details><summary><span className="score-event-index">{String(index + 1).padStart(2, '0')}</span><span><strong>{event.type}</strong>{preview && <small>{preview.slice(0, 130)}</small>}</span></summary><pre>{JSON.stringify(event, null, 2)}</pre></details></li>
          })}</ol>}
        </div>
      </section>
      <section className="score-code-panel">
        <header><h3>reward function</h3><span>rewards/banking.ts</span></header>
        <pre tabIndex={0} aria-label="Banking reward function source"><HighlightedCode source={rewardSource.slice(rewardSource.indexOf('export function scoreBankingRun'))} /></pre>
      </section>
      <section className="score-reward-panel">
        <h3>score</h3>
        <p className="score-big-number">{entry?.score ? number(entry.score.total) : '—'}</p>
        {entry?.score ? <>
          <dl className="score-reward-lines">
            <div><dt>Outcome<small>Matching expected record changes</small></dt><dd>{number(entry.score.outcomePoints)}</dd></div>
            <div><dt>Safety<small>Correct outcome, verification and consent</small></dt><dd>{number(entry.score.safetyPoints)}</dd></div>
            <div><dt>Penalties<small>Incorrect outcome and rejected operations</small></dt><dd>−{number(entry.score.penalty)}</dd></div>
            <div><dt>Efficiency<small>{entry.score.toolCalls} tool calls · time · tokens, capped at 5</small></dt><dd>{entry.score.efficiencyCost === null ? '—' : `−${number(entry.score.efficiencyCost)}`}</dd></div>
          </dl>
          {entry.score.total === null && <p className="scorer-hint">Time or token measurements are missing; the total is unknown.</p>}
          <details className="score-checks"><summary>Outcome and policy checks</summary><ul>{entry.score.checks.map((check, index) => <li key={index}><span className={check.pass ? 'scorer-pass' : 'scorer-error'}>{check.pass ? '✓' : '×'}</span> {check.name}<p>{check.detail}</p></li>)}</ul></details>
        </> : entry?.error ? <p className="scorer-error">Cannot score: {entry.error}</p> : <div className="score-placeholder"><p>Reward appears after a run is loaded.</p><div><span>Outcome</span><span>—</span></div><div><span>Safety</span><span>—</span></div><div><span>Penalties</span><span>—</span></div><div><span>Efficiency</span><span>—</span></div></div>}
      </section>
    </div>
  </Container>
}
