import { useState } from 'react'
import { bankRoutes, bankWeights, scoreBankRoute, type BankWeights } from './bank-trajectories'
import { BankRouteMap } from './BankRouteMap'

const money = (cents: number) => `$${(cents / 100).toLocaleString('en-US')}`
const score = (n: number) => `${n > 0 ? '+' : ''}${Number(n.toFixed(2))}`

export function BankTrajectories() {
  const [route, setRoute] = useState(0)
  const [cursor, setCursor] = useState(0)
  const [weights, setWeights] = useState<BankWeights>(bankWeights)
  const scored = bankRoutes.map(r => scoreBankRoute(r.actions, weights))
  const steps = scored[route]!
  const current = steps[cursor - 1]
  const bestScore = Math.max(...scored.map(s => s.at(-1)!.total))
  return <section className="bank-path-slide">
    <h2>same idea. <span className="accent">banking agent.</span></h2>
    <p className="bank-path-request">“Move $500 from savings to checking.”</p>
    <div className="bank-path-layout">
      <div>
        <div className="bank-route-picker" aria-label="Choose a trajectory">
          {bankRoutes.map((r, i) => <button key={r.name} aria-pressed={route === i} onClick={() => { setRoute(i); setCursor(0) }}>{r.name}</button>)}
        </div>
        <BankRouteMap route={route} cursor={cursor} />
        <p className="bank-current-call" aria-live="polite">
          <code>{!current ? 'Ready at the starting state.' : current.action.tool === 'list_accounts' ? 'list_accounts()' : `transfer(${money(current.action.amountCents)}, ${current.action.reverse ? 'checking → savings' : 'savings → checking'})`}</code>
          {current && <span>reward {score(current.reward)}</span>}
        </p>
        <div className="grid-buttons">
          <button onClick={() => setCursor(c => Math.min(c + 1, steps.length))} disabled={cursor >= steps.length}>Step</button>
          <button onClick={() => setCursor(steps.length)} disabled={cursor >= steps.length}>Run trajectory</button>
          <button onClick={() => setCursor(0)} disabled={cursor === 0}>Reset</button>
        </div>
        <dl className="bank-run-state" aria-live="polite">
          <div><dt>Savings</dt><dd>{money(current?.savings ?? 350000)}</dd></div>
          <div><dt>Checking</dt><dd>{money(current?.checking ?? 125000)}</dd></div>
          <div><dt>Return so far</dt><dd>{score(current?.total ?? 0)}</dd></div>
        </dl>
      </div>
      <div className="bank-reward-settings">
        {([
          ['completion', 'Task completed', 0, 20, 1],
          ['call', 'Per tool call', -2, 0, .1],
          ['excess', 'Per extra $500 moved', -5, 0, .5],
        ] as const).map(([key, label, min, max, step]) => <label key={key}><span>{label}<output>{score(weights[key])}</output></span><input type="range" min={min} max={max} step={step} value={weights[key]} onChange={e => setWeights(w => ({ ...w, [key]: Number(e.target.value) }))} /></label>)}
        <table className="bank-route-scores">
          <caption>Full-trajectory returns</caption>
          <thead><tr><th scope="col">Trajectory</th><th scope="col">Calls</th><th scope="col">Return</th></tr></thead>
          <tbody>{bankRoutes.map((r, i) => <tr key={r.name} className={scored[i]!.at(-1)!.total === bestScore ? 'preferred' : ''}><th scope="row">{r.name}</th><td>{r.actions.length}</td><td>{score(scored[i]!.at(-1)!.total)}</td></tr>)}</tbody>
        </table>
        <p className="bank-reward-hint">Set both penalties to 0: all three tie.<br />Then decide which behavior matters.</p>
      </div>
    </div>
    <p className="bank-path-note">Illustrative traces, not live model runs or language-model training. All reach the same balances; transaction records differ.<br />Completion is rewarded at the end. Excess movement counts all transfers beyond the requested $500. Per-call cost includes verification calls.</p>
  </section>
}
