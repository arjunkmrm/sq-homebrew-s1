import { useState } from 'react'

type ActionId = 'verify' | 'inspect' | 'search' | 'calculate' | 'consent' | 'credit' | 'report'
type HazardId = 'credit_early' | 'double_credit'
type AttemptId = ActionId | HazardId
type BankState = { verified: boolean; inspected: boolean; policyFound: boolean; calculated: boolean; consent: boolean; credited: boolean; reported: boolean }
type Action = { id: ActionId; label: string; short: string; seconds: number; cost: number; tool: boolean }
const initialState: BankState = { verified: false, inspected: false, policyFound: false, calculated: false, consent: false, credited: false, reported: false }
const actions: Action[] = [
  { id: 'verify', label: 'verify identity', short: 'verify', seconds: 2, cost: .002, tool: true },
  { id: 'inspect', label: 'inspect accounts', short: 'inspect', seconds: 2, cost: .003, tool: true },
  { id: 'search', label: 'search policies', short: 'search', seconds: 4, cost: .006, tool: true },
  { id: 'calculate', label: 'calculate correction', short: 'calculate', seconds: 1, cost: 0, tool: false },
  { id: 'consent', label: 'get consent', short: 'consent', seconds: 3, cost: 0, tool: false },
  { id: 'credit', label: 'credit account', short: 'credit', seconds: 2, cost: .002, tool: true },
  { id: 'report', label: 'file report', short: 'report', seconds: 2, cost: .002, tool: true },
]
const hazards: { id: HazardId; label: string; short: string; seconds: number; cost: number }[] = [
  { id: 'credit_early', label: 'credit without consent', short: 'rejected early credit', seconds: 2, cost: .002 },
  { id: 'double_credit', label: 'double credit', short: 'rejected double credit', seconds: 2, cost: .002 },
]
const available = (id: ActionId, s: BankState) => {
  if (s.credited && s.reported) return false
  return id === 'verify' ? !s.verified : id === 'inspect' || id === 'search' ? s.verified : id === 'calculate' ? s.inspected && s.policyFound && !s.calculated : id === 'consent' ? s.calculated && !s.consent : id === 'credit' ? s.consent && !s.credited : s.credited && !s.reported
}

function ActionIcon({ id }: { id: ActionId | HazardId | 'goal' }) {
  if (id === 'verify') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 5 6v5c0 4.5 2.7 8 7 10 4.3-2 7-5.5 7-10V6l-7-3Z" /><circle cx="12" cy="9" r="2" /><path d="M8.5 15c.7-2 1.8-3 3.5-3s2.8 1 3.5 3" /></svg>
  if (id === 'inspect') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 9 9-5 9 5M5 10h14M6 18h12M4 21h16M8 10v8m4-8v8m4-8v8" /></svg>
  if (id === 'search') return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="10" r="6" /><path d="m14.5 14.5 6 6M7 8h6m-6 3h4" /></svg>
  if (id === 'calculate') return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="1" /><path d="M8 7h8M8 12h1m3 0h1m3 0h1M8 16h1m3 0h1m3 0h1" /></svg>
  if (id === 'consent') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v12H9l-5 4V5Z" /><path d="m9 11 2 2 4-5" /></svg>
  if (id === 'credit') return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v10M7 12h10" /></svg>
  if (id === 'report') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h9l3 3v15H6V3Z" /><path d="M15 3v4h4M9 11h6m-6 4h6" /></svg>
  if (id === 'goal') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 21V4m0 1h11l-2 4 2 4H6" /><path d="m9 9 2 2 3-4" /></svg>
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 2.5 20h19L12 3Z" /><path d="M12 9v5m0 3v.2" /></svg>
}

export function AgentEnvironment() {
  const [state, setState] = useState(initialState)
  const [trail, setTrail] = useState<AttemptId[]>([])
  const [feedback, setFeedback] = useState('')
  const complete = state.credited && state.reported
  const hazardCount = trail.filter(id => id === 'credit_early' || id === 'double_credit').length
  const reward = -trail.length - hazardCount * 5 + (complete ? 20 : 0)
  const metadata = (id: AttemptId) => actions.find(a => a.id === id) ?? hazards.find(a => a.id === id)!
  const toolCalls = trail.filter(id => id === 'credit_early' || id === 'double_credit' || actions.find(a => a.id === id)?.tool).length
  const seconds = trail.reduce((sum, id) => sum + metadata(id).seconds, 0)
  const cost = trail.reduce((sum, id) => sum + metadata(id).cost, 0)
  const act = (id: ActionId) => {
    if (!available(id, state)) return
    setTrail(previous => [...previous, id]); setFeedback('')
    setState(previous => ({ ...previous, verified: previous.verified || id === 'verify', inspected: previous.inspected || id === 'inspect', policyFound: previous.policyFound || id === 'search', calculated: previous.calculated || id === 'calculate', consent: previous.consent || id === 'consent', credited: previous.credited || id === 'credit', reported: previous.reported || id === 'report' }))
  }
  const hitHazard = (id: HazardId) => {
    if (complete || (id === 'double_credit' && !state.credited)) return
    setTrail(previous => [...previous, id]); setFeedback(id === 'credit_early' ? 'Rejected: customer consent is required. Bank state unchanged.' : 'Rejected: correction already credited. Bank state unchanged.')
  }
  const reset = () => { setState(initialState); setTrail([]); setFeedback('') }
  return <section className="agent-environment-slide">
    <h2>same loop, <span className="accent">different environment</span></h2>
    <p className="agent-environment-note">TASK 093 · SIMULATED METRICS · −1 / ATTEMPT · −5 / HAZARD · +20 ON COMPLETION</p>
    <div className="agent-environment-layout">
      <div>
        <div className="agent-environment-grid" aria-label="Available banking actions and hazards">
          {actions.map((action, index) => { const count = trail.filter(item => item === action.id).length; return <button key={action.id} type="button" data-bank-action={action.id} onClick={() => act(action.id)} disabled={!available(action.id, state)} className={count ? 'visited' : ''}><span>{String(index + 1).padStart(2, '0')}</span><ActionIcon id={action.id} /><strong>{action.label}</strong>{count > 0 && <small>{count}×</small>}</button> })}
          {hazards.map(hazard => { const hit = trail.includes(hazard.id); return <button key={hazard.id} type="button" data-bank-hazard={hazard.id} onClick={() => hitHazard(hazard.id)} disabled={complete || (hazard.id === 'double_credit' && !state.credited)} className={'agent-environment-hazard' + (hit ? ' hazard-hit' : '')} aria-label={hazard.label + ', hazard: rejected with bank state unchanged'}><span>HAZARD · −6</span><ActionIcon id={hazard.id} /><strong>{hazard.label}</strong></button> })}
          <div className={'agent-environment-goal' + (complete ? ' complete' : '')}><span>GOAL</span><ActionIcon id="goal" /><strong>correct credit + report</strong></div>
        </div>
        <div className="agent-environment-trail" aria-live="polite"><span>ROUTE</span><p>{trail.length ? trail.map((id, index) => <span className={id === 'credit_early' || id === 'double_credit' ? 'hazard' : ''} key={id + '-' + index}>{metadata(id).short}</span>) : 'Choose an available action.'}</p></div>
        {feedback && <p className="agent-environment-feedback" role="status">{feedback}</p>}
      </div>
      <div className="agent-environment-state" aria-label="Current simulated bank state">
        <div className="agent-environment-state-heading"><span>BANK STATE</span><button type="button" data-bank-reset onClick={reset} disabled={!trail.length}>Reset</button></div>
        <dl>
          <div><dt>Silver balance</dt><dd className={state.credited ? 'changed' : ''}>{state.credited ? '$144,033' : '$144,000'}</dd></div>
          <div><dt>Identity</dt><dd>{state.verified ? 'verified' : 'pending'}</dd></div>
          <div><dt>Correction</dt><dd>{state.calculated ? '$33 calculated' : 'unknown'}</dd></div>
          <div><dt>Consent</dt><dd>{state.consent ? 'received' : 'pending'}</dd></div>
          <div><dt>Report</dt><dd className={state.reported ? 'changed' : ''}>{state.reported ? 'filed' : 'absent'}</dd></div>
        </dl>
        <div className="agent-environment-score">
          <div><span>ATTEMPTS</span><strong>{trail.length}</strong></div><div><span>TOOLS</span><strong>{toolCalls}</strong></div><div><span>TIME</span><strong>{seconds}s</strong></div><div><span>COST</span><strong>{'$' + cost.toFixed(3)}</strong></div><div><span>REWARD</span><strong>{reward > 0 ? '+' : ''}{reward}</strong></div>
        </div>
      </div>
    </div>
    <p className="agent-environment-disclaimer">Fixed teaching estimates, not wall time or model pricing. Hazards are safely rejected; no real bank tools are called.</p>
  </section>
}
