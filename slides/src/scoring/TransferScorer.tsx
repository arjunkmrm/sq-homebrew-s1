import { useEffect, useMemo, useState } from 'react'
import { loadRuns, type ViewRun } from '../viewer/load-run'
import { scoreTransferRun } from '../../../mini-tau3/rewards/transfer-run.ts'
import { defaultWeights, type RewardWeights } from '../../../mini-tau3/rewards/transfer-run'
import './scoring.css'

type Entry = { key: number; label: string; run: ViewRun }
const number = (value: number) => Number(value.toFixed(3)).toString()
export function TransferScorer({ embedded = false, initialRun }: { embedded?: boolean; initialRun?: ViewRun }) {
  const [entries, setEntries] = useState<Entry[]>([])
  const [weights, setWeights] = useState<RewardWeights>({ ...defaultWeights })
  const [errors, setErrors] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(0)
  useEffect(() => {
    if (initialRun) { setEntries(current => [{ key: -1, label: 'Workshop run', run: initialRun }, ...current.filter(entry => entry.key !== -1)]); setSelected(0) }
  }, [initialRun])
  const scores = useMemo(() => entries.map(entry => {
    try { return { ...entry, score: scoreTransferRun(entry.run, weights), error: undefined } }
    catch (error) { return { ...entry, score: undefined, error: error instanceof Error ? error.message : 'Could not score this run.' } }
  }), [entries, weights])
  async function addFiles(files: File[]) {
    const added: Omit<Entry, 'key'>[] = [], failures: string[] = []
    for (const file of files) {
      try { for (const run of loadRuns(await file.text())) added.push({ label: file.name, run }) }
      catch (error) { failures.push(`${file.name}: ${error instanceof Error ? error.message : 'Could not read file.'}`) }
    }
    setEntries(current => [...current, ...added.map((entry, index) => ({ ...entry, key: (current.at(-1)?.key ?? -1) + index + 1 }))])
    setErrors(failures)
  }
  async function sample() {
    setLoading(true)
    try {
      const response = await fetch('/runs/first-transfer.json')
      if (!response.ok) throw new Error('Could not load the recorded transfer.')
      await addFiles([new File([await response.text()], 'baseline · recorded transfer.json')])
    } catch (error) { setErrors([error instanceof Error ? error.message : 'Could not load run.']) }
    finally { setLoading(false) }
  }
  const entry = scores[Math.min(selected, scores.length - 1)]
  const Container = embedded ? 'div' : 'main'
  return <Container className={`transfer-scorer${embedded ? ' embedded-scorer' : ''}`}>
    {!embedded && <header className="scorer-header"><a href="/events">← Execution logs</a><a href="/#15">Reward function slide →</a></header>}
    {!embedded && <h1>score the <span className="accent">trajectory.</span></h1>}
    <div className="score-log-toolbar">
      {entries.length > 0 && <label>Run <select value={Math.min(selected, entries.length - 1)} onChange={event => setSelected(Number(event.target.value))}>{entries.map((item, index) => <option value={index} key={item.key}>{item.label}</option>)}</select></label>}
      <div className="scorer-actions"><label className="scorer-upload">Add run logs<input type="file" accept=".json,application/json" multiple onChange={event => { void addFiles(Array.from(event.target.files ?? [])); event.target.value = '' }} /></label><button onClick={() => void sample()} disabled={loading}>{loading ? 'Loading…' : 'Load baseline'}</button></div>
    </div>
    {errors.map((error, index) => <p className="scorer-error" role="alert" key={index}>{error}</p>)}
    <div className="score-log-layout">
      <section className="score-event-panel">
        <header><h3>event log</h3><span>{entry?.run.events.length ?? 0} events</span></header>
        {entry?.run.request && <p className="score-log-request">{entry.run.request}</p>}
        <div className="score-event-scroll" key={entry?.key}>
          {!entry ? <p className="scorer-empty">Run the agent on the previous slide, or load a log.</p> : !entry.run.events.length ? <p className="scorer-empty">No events recorded.</p> : <ol>{entry.run.events.map((event, index) => {
            const value = event.name ?? event.text ?? event.output ?? ''
            const preview = typeof value === 'string' ? value : JSON.stringify(value)
            return <li key={index}><details><summary><span className="score-event-index">{String(index + 1).padStart(2, '0')}</span><span><strong>{event.type}</strong>{preview && <small>{preview.slice(0, 130)}</small>}</span>{event.type === 'ToolCalled' && <span className="score-event-cost">{number(weights.call)}</span>}</summary><pre>{JSON.stringify(event, null, 2)}</pre></details></li>
          })}</ol>}
        </div>
      </section>
      <section className="score-reward-panel">
        <h3>reward</h3>
        <p className="score-big-number">{entry?.score ? number(entry.score.total) : '—'}</p>
        {entry?.score ? <><dl className="score-reward-lines"><div><dt>Task completed<small>{entry.score.completed ? 'State checks and agent completion pass' : 'Completion checks did not all pass'}</small></dt><dd>{number(entry.score.completion)}</dd></div><div><dt>{entry.score.toolCalls} tool calls<small>{number(weights.call)} per attempt</small></dt><dd>{number(entry.score.toolCost)}</dd></div></dl><p className="score-arithmetic">{number(entry.score.completion)} − {number(Math.abs(entry.score.toolCost))} = {number(entry.score.total)}</p><details className="score-checks"><summary>Completion checks</summary><ul>{entry.score.checks.map((check, index) => <li key={index}><span className={check.pass ? 'scorer-pass' : 'scorer-error'}>{check.pass ? '✓' : '×'}</span> {check.name}<p>{check.detail}</p></li>)}</ul></details></> : <p className={entry?.error ? 'scorer-error' : 'scorer-hint'}>{entry?.error ? `Cannot score: ${entry.error}` : 'Load a log to calculate its reward.'}</p>}
        <details className="score-adjust"><summary>Adjust reward weights</summary><div className="scorer-weights">
          {([{ key: 'completion', label: 'Completion', min: 0, max: 20, step: 1 }, { key: 'call', label: 'Per tool call', min: -3, max: 0, step: .1 }] as const).map(control => <label key={control.key}><span>{control.label}<strong>{number(weights[control.key])}</strong></span><input type="range" min={control.min} max={control.max} step={control.step} value={weights[control.key]} onChange={event => setWeights(current => ({ ...current, [control.key]: Number(event.target.value) }))} /></label>)}
        </div></details>
      </section>
    </div>
  </Container>
}
