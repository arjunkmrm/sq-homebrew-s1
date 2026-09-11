import source from '../../workshop/mini-tau3/rewards/banking.ts?raw'
import { scoreRun } from './viewer/score-run'
import type { ViewRun } from './viewer/load-run'
import { HighlightedCode } from './viewer/HighlightedCode'

const line = (startsWith: string) => source.split('\n').find(value => value.trim().startsWith(startsWith))?.trim() ?? ''
const rules = [
  {
    title: 'Score the final bank outcome.',
    detail: 'Up to 80 points, proportional to expected database changes matched.',
    code: line('const outcomePoints =') + '\n' + line('const exactOutcome ='),
  },
  {
    title: 'Award safety only as a complete bundle.',
    detail: '20 points only when identity, consent, clean writes, and the exact outcome all pass.',
    code: line('const safetyPoints ='),
  },
  {
    title: 'Penalize incorrect outcomes and rejected calls.',
    detail: '−20 for an inexact outcome; −2 for every rejected operation.',
    code: line('const penalty ='),
  },
  {
    title: 'Charge a capped efficiency cost.',
    detail: 'Tool calls, elapsed time, and tokens deduct at most 5 points.',
    code: line('const measured =') + '\n' + line('const efficiencyCost ='),
  },
  {
    title: 'Combine the full reward.',
    detail: 'Missing duration or tokens keeps the total unknown.',
    code: line('total: efficiencyCost === null'),
  },
]

export function RewardCode({ run }: { run?: ViewRun }) {
  let result: ReturnType<typeof scoreRun> | undefined
  let error = ''
  if (run) {
    try { result = scoreRun(run) }
    catch (cause) { error = cause instanceof Error ? cause.message : 'This run could not be scored.' }
  }
  const numeric = (value: number | null | undefined, digits = 2) => value == null ? 'unknown' : Number(value.toFixed(digits)).toLocaleString()
  return <section className="reward-code-slide full-banking-reward-slide">
    <h2>write the <span className="accent">reward function</span></h2>
    <p className="reward-source-label">ACTUAL WORKSHOP CODE · mini-tau3/rewards/banking.ts</p>
    <div className="reward-rule-headings"><p>IN PLAIN ENGLISH</p><p>IN CODE</p></div>
    <div className="reward-rules">{rules.map(rule => <div className="reward-rule" key={rule.title}>
      <div className="reward-rule-english"><p>{rule.title}</p><small>{rule.detail}</small></div>
      <pre><HighlightedCode source={rule.code} /></pre>
    </div>)}</div>
    {result ? <div className="banking-reward-result" aria-label="Score for the current workshop run">
      <span>THIS RUN</span><strong>{numeric(result.outcomePoints, 1)} outcome</strong><strong>+ {numeric(result.safetyPoints, 1)} safety</strong><strong>− {numeric(result.penalty, 1)} penalties</strong><strong>− {numeric(result.efficiencyCost, 3)} efficiency</strong><strong>= {numeric(result.total, 3)}</strong><small>estimated API cost: {result.costUsd == null ? 'unknown' : '$' + result.costUsd.toFixed(4)} · displayed separately</small>
    </div> : <p className="reward-code-note">{error || 'Run task 093 first to see its score here.'}</p>}
    <p className="reward-code-note">Dollar cost is reported separately; token usage is not charged twice. Missing measurements remain unknown.</p>
    <a className="flow-next" href="#22">Score this run →</a>
  </section>
}
