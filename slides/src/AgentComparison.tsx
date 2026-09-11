import { Fragment, useEffect, useMemo, useState } from 'react'
import { agentVariants, type AgentVersion } from '../../mini-tau3/agents/variant-info'
import { scoreInterestRun } from '../../mini-tau3/rewards/interest-run'
import { scoreEfficientRun, defaultEfficiencyWeights, type EfficiencyWeights } from '../../mini-tau3/rewards/efficient-run'
import { readRunStream } from './viewer/run-stream'
import { startRun } from './viewer/start-run'
import type { LogEvent, ViewRun } from './viewer/load-run'
import { ChatTranscript } from './viewer/ChatTranscript'
import { InterestCode } from './viewer/InterestCode'
import { VariantCode } from './viewer/VariantCode'
import { RunPicker } from './viewer/RunPicker'
import './comparison.css'

type Configuration = { id: string; version: AgentVersion; model: string; selected: boolean }
type Trial = Configuration & { modelLabel: string; status: 'queued' | 'running' | 'done' | 'error'; message: string; events: LogEvent[]; run?: ViewRun; error?: string }
const numeric = (value: number | null | undefined, digits = 2) => value == null ? '—' : Number(value.toFixed(digits)).toLocaleString()

export function AgentComparison({ task = 'transfer-between-own-accounts' }: { task?: 'transfer-between-own-accounts' | 'task_097' }) {
  const hard = task === 'task_097'
  const [configurations, setConfigurations] = useState<Configuration[]>(agentVariants.map(variant => ({ id: variant.id, version: variant.id, model: '', selected: true })))
  const [models, setModels] = useState<{ id: string; label: string }[]>([{ id: '', label: 'Configured default' }])
  const [modelError, setModelError] = useState('')
  const [codeRow, setCodeRow] = useState<string>()
  useEffect(() => {
    void fetch('/api/banking-models').then(async response => {
      if (!response.ok) throw new Error('Model options could not be loaded. Configured default is still available.')
      const value = await response.json()
      if (!Array.isArray(value.models)) throw new Error('Model options are unavailable.')
      setModels(value.models.some((model: {id:string}) => model.id === '') ? value.models : [{ id: '', label: 'Configured default' }, ...value.models])
    }).catch(error => setModelError(error.message))
  }, [])
  const selected = configurations.filter(configuration => configuration.selected)
  function editConfiguration(id: string, change: Partial<Configuration>) { setConfigurations(current => current.map(row => row.id === id ? { ...row, ...change } : row)) }
  const [trials, setTrials] = useState<Trial[]>([])
  const [busy, setBusy] = useState(false)
  const [inspect, setInspect] = useState<string>()
  const [view, setView] = useState<'chat' | 'events' | 'code'>('events')
  const [weights, setWeights] = useState<EfficiencyWeights>({ ...defaultEfficiencyWeights })
  const results = useMemo(() => trials.map(trial => {
    try { return { ...trial, score: trial.run ? (hard ? scoreInterestRun(trial.run) : scoreEfficientRun(trial.run, weights)) : undefined } }
    catch (cause) { return { ...trial, score: undefined, error: cause instanceof Error ? cause.message : 'Could not score run.' } }
  }), [trials, weights, hard])
  const inspected = results.find(trial => trial.id === inspect)
  function update(id: string, change: (trial: Trial) => Trial) { setTrials(current => current.map(trial => trial.id === id ? change(trial) : trial)) }
  async function runSelected() {
    if (busy || !selected.length) return
    setBusy(true); setInspect(selected[0].id); setCodeRow(undefined)
    setTrials(selected.map(row => ({ ...row, modelLabel: models.find(model => model.id === row.model)?.label ?? row.model, status: 'queued', message: 'Queued', events: [] })))
    let cursor = 0
    async function worker() {
      while (cursor < selected.length) {
        const row = selected[cursor++]
        const id = row.id
        update(id, trial => ({ ...trial, status: 'running', message: 'Starting…' }))
        try {
          const query = new URLSearchParams({ version: row.version, case: task })
          if (row.model) query.set('model', row.model)
          const response = await startRun(`/api/banking-run?${query}`, () => update(id, trial => ({ ...trial, status: 'queued', message: 'Waiting for a free slot…' })))
          if (!response.ok) {
            const detail = await response.json().catch(() => null)
            throw new Error(detail?.error ?? 'Could not start this agent.')
          }
          update(id, trial => ({ ...trial, status: 'running', message: 'Starting…' }))
          const run = await readRunStream(response, packet => update(id, trial => packet.kind === 'event' ? { ...trial, events: [...trial.events, packet.event] } : { ...trial, message: packet.message }))
          update(id, trial => ({ ...trial, events: run.events, run, status: run.error ? 'error' : 'done', message: run.error ? 'Finished with an error' : 'Complete' }))
        } catch (cause) { update(id, trial => ({ ...trial, status: 'error', message: 'Run failed', error: cause instanceof Error ? cause.message : 'Run failed.' })) }
      }
    }
    try { await Promise.all(Array.from({ length: Math.min(3, selected.length) }, () => worker())) }
    finally { setBusy(false) }
  }
  return <section className="agent-comparison">
    <h2>{hard ? <>investigate the <span className="accent">interest.</span></> : <>run the <span className="accent">variations</span></>}</h2>
    <p className="comparison-context">{hard ? 'Four accounts. Conflicting claims. Product policies. A fresh portfolio for every run.' : 'Same task. Choose the agent and model. A fresh bank for every run.'}</p>
    <div className="comparison-workbench comparison-three-columns"><div className="comparison-workbench-main"><h3 className="comparison-column-title">Configurations</h3>
    <div className="configuration-table-wrap"><table className="configuration-table"><thead><tr><th>Run</th><th>Agent</th><th>Model</th><th>Code</th><th></th></tr></thead><tbody>{configurations.map(row => <Fragment key={row.id}><tr>
      <td><input type="checkbox" aria-label={`Run ${row.version}`} checked={row.selected} disabled={busy} onChange={event => editConfiguration(row.id, { selected: event.target.checked })} /></td>
      <td><select aria-label="Agent version" disabled={busy} value={row.version} onChange={event => editConfiguration(row.id, { version: event.target.value as AgentVersion })}>{agentVariants.map(variant => <option key={variant.id} value={variant.id}>{variant.label}</option>)}</select></td>
      <td><select aria-label={`Model for ${row.version}`} disabled={busy} value={row.model} onChange={event => editConfiguration(row.id, { model: event.target.value })}>{models.map(model => <option key={model.id} value={model.id}>{model.label}</option>)}</select></td>
      <td><button aria-expanded={codeRow === row.id} onClick={() => setCodeRow(current => current === row.id ? undefined : row.id)}>{codeRow === row.id ? 'Hide code' : 'View code'}</button></td>
      <td className="configuration-row-actions"><button disabled={busy} onClick={() => setConfigurations(current => [...current, { ...row, id: crypto.randomUUID() }])}>Duplicate</button><button aria-label={`Remove ${row.version} row`} disabled={busy || configurations.length === 1} onClick={() => setConfigurations(current => current.filter(item => item.id !== row.id))}>×</button></td>
    </tr>{codeRow === row.id && <tr className="configuration-code-row"><td colSpan={5}>{hard ? <InterestCode version={row.version} /> : <VariantCode key={row.version} version={row.version} inline />}</td></tr>}</Fragment>)}</tbody></table></div>
    <button className="add-configuration" disabled={busy} onClick={() => setConfigurations(current => [...current, { id: crypto.randomUUID(), version: 'baseline', model: '', selected: true }])}>+ Add configuration</button>
    {modelError && <p className="scorer-hint">{modelError}</p>}
    <div className="comparison-actions"><button disabled={busy || !selected.length} onClick={() => void runSelected()}>{busy ? 'Running in parallel…' : `Run ${selected.length} selected runs →`}</button><span aria-live="polite">{busy ? `${trials.filter(trial => trial.status === 'done' || trial.status === 'error').length} / ${trials.length} finished` : trials.length ? 'Select a row to inspect its trajectory.' : 'Up to 3 runs at once; additional rows wait in the queue.'}</span></div>
    </div>
    <section className="comparison-outcomes"><h3 className="comparison-column-title">Results</h3>
    <div className="comparison-outcome-scroll">{!results.length && <p className="comparison-placeholder">Run your configurations to compare their scores.</p>}{results.map(trial => <button key={trial.id} className={`comparison-outcome${inspect === trial.id ? ' is-selected' : ''}`} onClick={() => setInspect(trial.id)} aria-pressed={inspect === trial.id}>
      <span className="outcome-heading"><strong>{agentVariants.find(variant => variant.id === trial.version)?.label}</strong><span className="outcome-score">{numeric(trial.score?.total)}</span></span>
      <span className="outcome-model">{trial.modelLabel} · {trial.message}</span>
      <span className="outcome-compact-metrics"><span>{trial.score ? trial.score.completed ? '✓ Done' : '× Incomplete' : trial.status === 'error' ? '× Failed' : '…'}</span><span>{trial.score?.durationMs != null ? `${numeric(trial.score.durationMs / 1000)}s` : '— s'}</span><span>{numeric(trial.score?.totalTokens, 0)} tokens</span><span>{trial.score?.toolCalls ?? trial.events.filter(event => event.type === 'ToolCalled').length} tools</span><span>{trial.score?.costUsd != null ? `$${numeric(trial.score.costUsd, 4)}` : '$—'}</span></span>
    </button>)}</div>
    {hard ? <details className="comparison-weight-panel"><summary>How the reward works</summary><p>80 points across four credits and four reports. 20 for verification, consent, and clean operations. Wrong or duplicate credits and rejected operations lose points. Time, tokens, and calls deduct at most 5.</p></details> : <details className="comparison-weight-panel"><summary>Reward weights</summary><div>{([{ key: 'completion', label: 'Completion', min: 0, max: 20, step: 1 }, { key: 'call', label: 'Per tool call', min: -3, max: 0, step: .1 }, { key: 'second', label: 'Per second', min: -1, max: 0, step: .05 }, { key: 'thousandTokens', label: 'Per 1,000 tokens', min: -2, max: 0, step: .1 }] as const).map(control => <label key={control.key}>{control.label}<strong>{numeric(weights[control.key])}</strong><input type="range" min={control.min} max={control.max} step={control.step} value={weights[control.key]} onChange={event => setWeights(current => ({ ...current, [control.key]: Number(event.target.value) }))} /></label>)}</div></details>}
    </section>
    {inspected ? <section className="comparison-inspect"><header><RunPicker value={inspected.id} onChange={setInspect} options={results.map((trial, index) => ({ value: trial.id, label: `${index + 1}. ${agentVariants.find(variant => variant.id === trial.version)?.label} · ${trial.modelLabel}` }))} /><div><button aria-pressed={view === 'chat'} onClick={() => setView('chat')}>Chat</button><button aria-pressed={view === 'events'} onClick={() => setView('events')}>Events</button><button aria-pressed={view === 'code'} onClick={() => setView('code')}>Code</button></div></header>{inspected.error && <p className="scorer-error">{inspected.error}</p>}{inspected.score?.missing.length ? <p className="scorer-hint">Missing measurements: {inspected.score.missing.join(', ')}</p> : null}<div className="comparison-event-scroll">{hard && inspected.score && <details className="interest-score-checks"><summary>Reward checks · {inspected.score.checks.filter(check => check.pass).length} / {inspected.score.checks.length}</summary>{"outcomePoints" in inspected.score && <p>Outcomes {numeric(inspected.score.outcomePoints)} + safe operations {numeric(inspected.score.safetyPoints)} − penalties {numeric(inspected.score.penalty)} − efficiency {numeric(inspected.score.efficiencyCost)}</p>}<ul>{inspected.score.checks.map(check => <li key={check.name} title={check.detail}>{check.pass ? "✓" : "×"} {check.name}</li>)}</ul></details>}{view === 'code' ? (hard ? <InterestCode version={inspected.version} /> : <VariantCode key={inspected.version} version={inspected.version} inline />) : view === 'chat' ? <ChatTranscript events={inspected.events} busy={inspected.status === 'running'} /> : inspected.events.map((event, index) => <details key={`${inspected.id}-${index}`}><summary><span>{String(index + 1).padStart(2, '0')}</span> {event.type}{typeof event.name === 'string' && <small> · {event.name}</small>}</summary><pre>{JSON.stringify(event, null, 2)}</pre></details>)}</div></section> : <section className="comparison-inspect comparison-inspect-empty"><h3 className="comparison-column-title">Chat / Events / Code</h3><p className="comparison-placeholder">Select a result to inspect its live trajectory.</p></section>}
    </div>
  </section>
}
