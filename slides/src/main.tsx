import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { BankIllustration } from './BankIllustration'
import { Gridworld } from './Gridworld'
import { BankTrajectories } from './BankTrajectories'
import { TrajectoryComplexity } from './TrajectoryComplexity'
import { RewardInputs } from './RewardInputs'
import { TardigradeMotivation } from './TardigradeMotivation'
import { RewardCode } from './RewardCode'
import { EventViewer } from './viewer/EventViewer'
import { TransferScorer } from './scoring/TransferScorer'
import { RunBankTask } from './RunBankTask'
import { EfficiencyReward } from './EfficiencyReward'
import { AgentComparison } from './AgentComparison'
import { InterestTask } from './InterestTask'
import type { ViewRun } from './viewer/load-run'
import './styles.css'
import './workshop-flow.css'

const pageCount = 20
const readPage = () => Math.max(1, Math.min(pageCount, Math.trunc(Number(window.location.hash.slice(1))) || 1))

function App() {
  const [page, setPage] = useState(readPage)
  const [workshopRun, setWorkshopRun] = useState<ViewRun>()

  useEffect(() => {
    const navigate = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLElement && event.target.closest('input, button, select, textarea, a, [contenteditable="true"]')) return
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
      if (['ArrowRight', 'PageDown', 'ArrowLeft', 'PageUp', 'Home', 'End'].includes(event.key)) {
        event.preventDefault()
        const next = event.key === 'Home' ? 1 : event.key === 'End' ? pageCount : Math.max(1, Math.min(pageCount, readPage() + (['ArrowRight', 'PageDown'].includes(event.key) ? 1 : -1)))
        window.location.hash = String(next)
        setPage(next)
      }
    }
    const sync = () => setPage(readPage())
    window.addEventListener('keydown', navigate)
    window.addEventListener('hashchange', sync)
    return () => {
      window.removeEventListener('keydown', navigate)
      window.removeEventListener('hashchange', sync)
    }
  }, [])

  return (
    <main aria-label={`Slide ${page}`} className={page === 16 || page === 18 || page === 20 ? 'workshop-app-slide' : undefined}>
      {page === 1 ? <h1>
        <span className="opening">stop writing <span className="strike">evals.</span></span>
        <span className="accent">start writing<br />reward functions.</span>
      </h1> : page === 2 ? <section className="scene-slide">
        <h2>we’re building an agent<br />for <span className="accent">banking tasks.</span></h2>
        <div className="scene-body">
          <div className="bank-requests">
            <p>“How much is in my savings?”</p>
            <p>“Move $500 into checking.”</p>
            <p>“Transfer my balance,<br />then close savings.”</p>
          </div>
          <BankIllustration />
        </div>
        <div className="scene-policies">
          <p className="policy-label">THE BANK’S RULES</p>
          <p>Own accounts only. No overdrafts.<br />Close accounts only at $0, with no pending transactions.</p>
        </div>
      </section> : page === 3 ? <section className="eval-slide">
        <h2>setting up <span className="accent">evals</span></h2>
        <table className="eval-cases">
          <thead><tr><th scope="col">USER QUERY</th><th scope="col">EXPECTED ANSWER</th></tr></thead>
          <tbody>
            <tr><td>“How much is in my savings?”</td><td>“Your balance is <strong>$3,500.</strong>”</td></tr>
            <tr><td>“Move $500 into checking.”</td><td>“Transferred <strong>$500.</strong><br />Savings: $3,000. Checking: $1,750.”</td></tr>
            <tr><td>“Move $4,000 into checking.”</td><td>“Insufficient funds.<br /><strong>No transfer made.</strong>”</td></tr>
          </tbody>
        </table>
        <p className="comparison">Same starting state. Run the agent.<br />Compare its answer to the reference.</p>
      </section> : page === 4 ? <section className="grader-slide">
        <h2>grading the <span className="accent">response</span></h2>
        <div className="grader-types">
          <div>
            <h3>code grader</h3>
            <p>Check exact values, required text,<br />or structured fields.</p>
          </div>
          <div>
            <h3 className="accent">LLM judge <small>OUR DEMO</small></h3>
            <p>Compare the answer’s meaning<br />with the reference.</p>
          </div>
        </div>
        <div className="judge-example">
          <dl>
            <div><dt>QUERY</dt><dd>“How much is in my savings?”</dd></div>
            <div><dt>EXPECTED</dt><dd>“Your balance is $3,500.”</dd></div>
            <div><dt>ACTUAL</dt><dd>“You have $3,500 in savings.”</dd></div>
          </dl>
          <span className="judge-arrow" aria-hidden="true">→</span>
          <div className="judge-result">
            <span className="example-label">EXAMPLE JUDGMENT</span>
            <p className="result-pass">pass</p>
            <p>Same balance.<br />Equivalent meaning.</p>
          </div>
        </div>
      </section> : page === 5 ? <section className="state-slide">
        <h2>but did the money<br /><span className="accent">actually move?</span></h2>
        <div className="state-example">
          <div className="claimed-result">
            <p className="state-label">ILLUSTRATIVE AGENT RESPONSE</p>
            <blockquote>“Transferred $500.<br />Savings: $3,000.<br />Checking: $1,750.”</blockquote>
            <p className="response-verdict">Response matches the reference.</p>
          </div>
          <div className="actual-state">
            <p className="state-label">ACTUAL BANK STATE</p>
            <table>
              <thead><tr><th scope="col">Account</th><th scope="col">Before</th><th scope="col">After</th></tr></thead>
              <tbody>
                <tr><th scope="row">Savings</th><td>$3,500</td><td>$3,500</td></tr>
                <tr><th scope="row">Checking</th><td>$1,250</td><td>$1,250</td></tr>
              </tbody>
            </table>
            <p className="state-verdict">No transfer happened.</p>
          </div>
        </div>
        <p className="state-takeaway">Check the balances and transaction record, too.</p>
      </section> : page === 6 ? <section className="outcome-slide">
        <h2>checking the <span className="accent">final state</span></h2>
        <p className="outcome-request">“Move $500 from savings to checking.”</p>
        <div className="outcome-columns">
          <div>
            <p className="state-label">STARTING STATE</p>
            <dl className="balance-list">
              <div><dt>Savings</dt><dd>$3,500</dd></div>
              <div><dt>Checking</dt><dd>$1,250</dd></div>
            </dl>
          </div>
          <span className="outcome-arrow" aria-hidden="true">→</span>
          <div>
            <p className="state-label">EXPECTED FINAL STATE</p>
            <dl className="balance-list final-balances">
              <div><dt>Savings</dt><dd>$3,000</dd></div>
              <div><dt>Checking</dt><dd>$1,750</dd></div>
            </dl>
            <p className="transfer-record">A completed $500 transfer is recorded.</p>
          </div>
        </div>
        <div className="outcome-question">
          <p>We can verify the task was completed.</p>
          <p className="accent">How well did the agent get there?</p>
        </div>
      </section> : page === 7 ? <section className="reward-slide">
        <h2>a <span className="accent">reward function</span></h2>
        <p className="reward-definition">A function that assigns a score to a run.</p>
        <div className="reward-expression" aria-label="Reward takes the task, trajectory, and final state and returns a score">
          <code><span className="accent">reward</span>(task, trajectory, finalState)</code>
          <span aria-hidden="true">→</span>
          <span className="accent">score</span>
        </div>
        <div className="reward-evidence">
          <div><h3>the outcome</h3><p>Was the requested transfer completed?</p></div>
          <div><h3>the trajectory</h3><p>What did the agent do along the way?</p></div>
        </div>
        <p className="reward-purpose">Make our preferences explicit.<br />Use the score to guide improvement.</p>
        <p className="reward-note">Here, we’ll score both. Evals can inspect trajectories too; rewards can also use only the outcome.</p>
      </section> : page === 8 ? <section className="rl-slide">
        <h2>reinforcement <span className="accent">learning</span></h2>
        <div className="rl-loop" aria-label="The agent acts on the environment, which returns a new state and reward.">
          <span>agent</span><span className="rl-arrow">action →</span><span>environment</span>
        </div>
        <p className="rl-feedback">← new state + reward</p>
        <p className="rl-main">Training updates the agent’s policy<br />to increase expected future reward.</p>
        <p className="rl-definition"><strong>Policy</strong> = its strategy for choosing actions.</p>
        <p className="reward-note">A bank’s policies are business rules. In RL, the policy is the agent’s behavior.</p>
        <p className="reward-note"><a href="https://www.gatsby.ucl.ac.uk/~dayan/papers/dw01.pdf" target="_blank" rel="noreferrer">Dayan &amp; Watkins · Reinforcement Learning</a></p>
      </section> : page === 9 ? <Gridworld /> : page === 10 ? <BankTrajectories /> : page === 11 ? <TrajectoryComplexity /> : page === 12 ? <RewardInputs /> : page === 13 ? <TardigradeMotivation /> : page === 15 ? <RewardCode run={workshopRun} /> : page === 17 ? <EfficiencyReward /> : null}
      <div className={page === 14 ? 'workshop-embedded-slide' : 'workshop-hidden'}><RunBankTask run={workshopRun} onRun={setWorkshopRun} /></div>
      <section className={page === 16 ? 'workshop-embedded-slide' : 'workshop-hidden'}><h2>score it. <span className="accent">then compare.</span></h2><TransferScorer embedded initialRun={workshopRun} /><a className="flow-next" href="#17">Improve the reward function →</a></section>
      <div className={page === 18 ? 'workshop-embedded-slide' : 'workshop-hidden'}><AgentComparison /></div>
      {page === 19 && <InterestTask />}
      <div className={page === 20 ? 'workshop-embedded-slide' : 'workshop-hidden'}><AgentComparison task="task_097" /></div>
    </main>
  )
}

const route = window.location.pathname.replace(/\/$/, '')
createRoot(document.getElementById('root')!).render(<StrictMode>{route === '/events' ? <EventViewer /> : route === '/rewards' ? <TransferScorer /> : <App />}</StrictMode>)
