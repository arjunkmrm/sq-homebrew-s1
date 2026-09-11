import source from '../../mini-tau3/rewards/transfer-run.ts?raw'
import { scoreTransferRun } from '../../mini-tau3/rewards/transfer-run'
import type { ViewRun } from './viewer/load-run'
import { HighlightedCode } from './viewer/HighlightedCode'

const statement = (name: string) => source.match(new RegExp(`^  const ${name} = .+$`, 'm'))?.[0].trim() ?? ''
const rules = [
  { title: 'Give 10 points for completing the task.', detail: 'The final state is correct and the agent finishes.', code: statement('completion') },
  { title: 'Subtract 0.5 for every tool call.', detail: 'Extra lookups and failed attempts count too.', code: statement('toolCost') },
  { title: 'Add them up. That’s the reward.', detail: '', code: source.match(/^    total: .+$/m)?.[0].trim().replace(/,$/, '') ?? '' },
]

export function RewardCode({ run }: { run?: ViewRun }) {
  let result: ReturnType<typeof scoreTransferRun> | undefined
  if (run) {
    try { result = scoreTransferRun(run) } catch { /* The scoring slide explains unsupported logs. */ }
  }
  return <section className="reward-code-slide">
    <h2>write the <span className="accent">reward function</span></h2>
    <div className="reward-rule-headings"><p>IN PLAIN ENGLISH</p><p>IN CODE</p></div>
    <div className="reward-rules">{rules.map((rule, index) => <div className="reward-rule" key={index}>
      <div className="reward-rule-english"><p>{rule.title}</p>{rule.detail && <small>{rule.detail}</small>}</div>
      <pre><HighlightedCode source={rule.code} /></pre>
    </div>)}</div>
    <p className="reward-code-note">Code from rewards/transfer-run.ts. The weights are +10 for completion and −0.5 per tool call.</p>
    {result && <p className="reward-run-total">This run: {result.completion} − {Math.abs(result.toolCost)} = <strong>{Number(result.total.toFixed(3))}</strong></p>}
    <a className="flow-next" href="#16">Score this run →</a>
  </section>
}
