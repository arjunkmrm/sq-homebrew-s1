import source from '../../mini-tau3/rewards/efficient-run.ts?raw'
import { HighlightedCode } from './viewer/HighlightedCode'

const line = (name: string) => source.match(new RegExp(`^\\s*const ${name} = .+$`, 'm'))?.[0].trim() ?? ''
export function EfficiencyReward() {
  return <section className="reward-code-slide">
    <h2>make the reward <span className="accent">more useful</span></h2>
    <p className="efficiency-intro">Keep completion and tool cost. Now account for time and tokens.</p>
    <div className="reward-rule-headings"><p>IN PLAIN ENGLISH</p><p>IN CODE</p></div>
    <div className="reward-rules">
      <div className="reward-rule"><div className="reward-rule-english"><p>Reward correct completion.</p><small>+10 when the task succeeds; −0.5 per tool call.</small></div><pre><HighlightedCode source={line('completion') + '\n' + line('toolCost')} /></pre></div>
      <div className="reward-rule"><div className="reward-rule-english"><p>Prefer less waiting.</p><small>Subtract 0.1 per second of agent execution.</small></div><pre><HighlightedCode source={line('timeCost')} /></pre></div>
      <div className="reward-rule"><div className="reward-rule-english"><p>Prefer fewer tokens.</p><small>Subtract 0.2 per 1,000 input + output tokens.</small></div><pre><HighlightedCode source={line('tokenCost')} /></pre></div>
    </div>
    <p className="efficiency-equation">reward = completion + tool cost + time cost + token cost</p>
    <p className="reward-code-note">Measure the agent, excluding the judge. Display estimated dollar cost separately; don’t charge twice for tokens.<br />Missing measurements stay unknown. These weights express our preferences—we can change them.</p>
    <a className="flow-next" href="#18">Run multiple agent versions →</a>
  </section>
}
