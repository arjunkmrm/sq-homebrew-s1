import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Gridworld } from './Gridworld'
import { AgentEnvironment } from './AgentEnvironment'
import { RewardInputs } from './RewardInputs'
import { TardigradeMotivation } from './TardigradeMotivation'
import { RewardCode } from './RewardCode'
import { EventViewer } from './viewer/EventViewer'
import { TransferScorer } from './scoring/TransferScorer'
import { RunBankTask } from './RunBankTask'
import { ImproveBaseline, RunChallenge, CompareChallenge } from './WorkshopFinish'
import { TauBenchHomework } from './TauBenchHomework'
import { AboutPenrose } from './AboutPenrose'
import { RunTaskFlow } from './RunTaskFlow'
import { BankIllustration } from './BankIllustration'
import { HighlightedCode } from './viewer/HighlightedCode'
import task093Source from '../../workshop/mini-tau3/tasks/task_093.json?raw'
import type { ViewRun } from './viewer/load-run'
import './styles.css'
import './workshop-flow.css'

const pageCount = 26
const readPage = () => Math.max(1, Math.min(pageCount, Math.trunc(Number(window.location.hash.slice(1))) || 1))
const taskAnatomyJsonc = `{
  // Bank records for this run
  "initial_state": {},

  // Private customer instructions
  "user_scenario": {},

  "evaluation_criteria": {
    // Reference actions → expected state
    "actions": [],

    // Compare final bank state
    "reward_basis": ["DB"]
  },

  // Policies relevant to this task
  "required_documents": []
}`

function App() {
  const [page, setPage] = useState(readPage)
  const [workshopRun, setWorkshopRun] = useState<ViewRun>()

  useEffect(() => {
    const navigate = (event: KeyboardEvent) => {
      const interactiveTarget = event.target instanceof HTMLElement
        ? event.target.closest('input, button, select, textarea, a, pre[tabindex], [contenteditable="true"]')
        : null
      if (interactiveTarget && !interactiveTarget.closest('[data-slide-navigation]')) return
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

  const goToPage = (nextPage: number) => {
    const next = Math.max(1, Math.min(pageCount, nextPage))
    window.location.hash = String(next)
    setPage(next)
  }

  return (
    <main aria-label={`Slide ${page} of ${pageCount}`} className={`slide-deck${page === 22 || page === 23 || page === 25 ? ' workshop-app-slide' : ''}`}>
      {page === 1 ? <h1>
        <span className="opening">stop writing <span className="strike">evals.</span></span>
        <span className="accent">start writing<br />reward functions.</span>
      </h1> : page === 2 ? <section className="about-slide">
        <AboutPenrose />
        <p className="about-kicker">about me</p>
        <div className="about-layout">
          <div className="about-copy">
            <h2>Arjun<span aria-hidden="true">.</span></h2>
            <div className="about-bio">
              <p>Previously, founding engineer<br />at <strong>smithery.ai</strong><span className="about-company-description">MCP marketplace</span></p>
              <p>Now, co-founding<br /><strong>clavia.ai</strong><span className="about-company-description">applied research lab</span></p>
            </div>
          </div>
          <a className="about-social" href="https://x.com/arjunkmrm" target="_blank" rel="noreferrer" aria-label="Follow Arjun on X at arjunkmrm">
            <img src="/arjunkmrm-x-qr.svg" alt="QR code for x.com/arjunkmrm" />
            <span className="about-social-label">X / TWITTER</span>
            <span className="about-handle">@arjunkmrm</span>
          </a>
        </div>
      </section> : page === 4 ? <section className="starting-slide">
        <div className="starting-heading">
          <p className="starting-kicker">BEFORE WE BEGIN</p>
          <h2>where we’re <span className="accent">starting</span></h2>
        </div>
        <div className="starting-grid">
          <div className="starting-prereqs">
            <h3>Bring with you</h3>
            <ul>
              <li><strong>Bun 1.4+</strong><span>and a terminal + editor</span></li>
              <li><strong>Basic TypeScript</strong><span>enough to read and edit a function</span></li>
              <li><strong>OpenRouter credits</strong><span>the agent and simulated customer both use tokens</span></li>
            </ul>
            <p>Add <code>OPENROUTER_API_KEY</code> to <code>.env</code>.</p>
          </div>
          <div className="starting-setup">
            <h3>Set up the repo</h3>
            <div className="starting-setup-row">
              <pre><code><span>git clone https://github.com/arjunkmrm/sq-homebrew-s1</span>{'\n'}<span>cd sq-homebrew-s1</span>{'\n'}<span>bun install --frozen-lockfile</span>{'\n'}<span>cp .env.example .env</span></code></pre>
              <a className="starting-repo" href="https://github.com/arjunkmrm/sq-homebrew-s1" target="_blank" rel="noreferrer">
                <img src="/sq-homebrew-s1-qr.svg" alt="QR code for the workshop GitHub repository" />
                <span>open repository ↗</span>
              </a>
            </div>
            <p>Default model</p>
            <code className="starting-model">openrouter:openai/gpt-5.6-terra</code>
          </div>
        </div>
        <a className="starting-docs" href="https://github.com/arjunkmrm/sq-homebrew-s1/blob/main/SETUP.md" target="_blank" rel="noreferrer">Full setup instructions in SETUP.md →</a>
      </section> : page === 5 ? <section className="working-with-slide">
        <h2>what we’ll be <span className="accent">working with</span></h2>
        <div className="working-with-columns">
          <article>
            <div className="working-with-heading"><span>ENVIRONMENT</span><a href="https://github.com/sierra-research/tau2-bench" target="_blank" rel="noreferrer">τ³ benchmark ↗</a></div>
            <h3>τ³ banking tasks</h3>
            <p className="working-with-intro">An adapted mini environment built from 10 banking tasks.</p>
            <ul>
              <li><strong>bank state + tools</strong><span>read and update customer records</span></li>
              <li><strong>policy documents</strong><span>ground the agent’s decisions</span></li>
              <li><strong>simulated customer</strong><span>provides identity, context, and consent</span></li>
            </ul>
          </article>
          <article>
            <div className="working-with-heading"><span>AGENT RUNTIME</span><a href="https://github.com/clavia-labs/tardigrade" target="_blank" rel="noreferrer">Tardigrade ↗</a></div>
            <h3>Tardigrade</h3>
            <p className="working-with-intro">Build and run the banking agent while keeping its execution observable.</p>
            <ul>
              <li><strong>messages</strong><span>customer and agent turns</span></li>
              <li><strong>tool calls + results</strong><span>what the agent did in the bank</span></li>
              <li><strong>trajectory</strong><span>the evidence our reward will score</span></li>
            </ul>
          </article>
        </div>
      </section> : page === 6 ? <section className="building-slide">
        <div className="building-copy">
          <p className="task-id">WHAT WE’LL BE BUILDING</p>
          <h2>a banking<br /><span className="accent">support agent</span></h2>
          <p>An agent that helps customers while following bank policy and using the right tools.</p>
          <div className="building-capabilities"><span>policies</span><span>accounts</span><span>transfers</span></div>
        </div>
        <BankIllustration />
      </section> : page === 3 ? <section className="goals-slide">
        <h2>by the end, <span className="accent">you’ll…</span></h2>
        <ol className="workshop-goals">
          <li>
            <svg className="goal-icon" viewBox="0 0 50 50" aria-hidden="true"><path d="M5 20 24 7l19 13M8 23h32M12 26v14m8-14v14m8-14v14m8-14v14M6 43h36" /></svg>
            <div><h3>Understand the environment</h3><p>Connect states, actions, and rewards in a small RL example.</p></div>
          </li>
          <li>
            {/* Hugeicons `rubber-duck`, MIT; see notices/hugeicons-LICENSE */}
            <svg className="goal-icon goal-icon-fine" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinejoin="round" d="M4.627 6a4.002 4.002 0 0 1 7.874 1a4 4 0 0 1-1.354 3h5.832C18.357 10 19 8.88 19 7.5c3.5 3.5 2.969 7.5 2.969 7.5c0 3.5-3.469 6-8.969 6H8.99a5.495 5.495 0 0 1-5.49-5.5a5.5 5.5 0 0 1 3.126-4.965A4 4 0 0 1 5.037 9m-.41-3L2.001 7c.19 1 1.063 2 3.035 2m-.409-3l.587.855A1.7 1.7 0 0 1 5.036 9" /><path strokeLinejoin="round" d="M11.001 18h1.5c2.21 0 5-2.79 5-5h-6.5a2.5 2.5 0 0 0 0 5" /><path d="M8.25 6.25h.124m.125 0a.25.25 0 1 0-.5 0a.25.25 0 0 0 .5 0Z" /></svg>
            <div><h3>Evaluate an agent</h3><p>Run banking tasks and verify that the intended outcome happened.</p></div>
          </li>
          <li>
            <svg className="goal-icon" viewBox="0 0 50 50" aria-hidden="true"><text x="4" y="33" fill="currentColor" stroke="none" fontSize="28" fontFamily="monospace">f()</text></svg>
            <div><h3>Write a reward function</h3><p>Score outcomes, trajectories, time, and tokens.</p></div>
          </li>
          <li>
            <svg className="goal-icon" viewBox="0 0 50 50" aria-hidden="true"><path d="m7 36 11-8 10 5 15-16" /><circle cx="43" cy="17" r="3" fill="currentColor" stroke="none" /></svg>
            <div><h3>Improve your agent</h3><p>Change its behavior, run all 10 tasks, and compare scores.</p></div>
          </li>
        </ol>
        <p className="goals-output"><span>YOU’LL LEAVE WITH</span>Your own banking agent, a reward function, and a scored run across 10 tasks.</p>
      </section> : page === 7 ? <section className="repo-map-slide">
        <h2>find your way <span className="accent">around</span></h2>
        <div className="repo-map-layout">
          <div className="repo-tree" aria-label="Workshop repository file tree">
            <p><strong>sq-homebrew-s1/</strong></p>
            <p className="tree-depth-1"><strong>mini-tau3/</strong></p>
            <p className="tree-depth-2">agents/baseline/</p>
            <p className="tree-depth-3 tree-start">actor.ts <span>START EDITING HERE</span></p>
            <p className="tree-depth-2">environment/ <span className="tree-note">bank + tools</span></p>
            <p className="tree-depth-3">banking.ts</p>
            <p className="tree-depth-3">tools.ts</p>
            <p className="tree-depth-3">customer/ <span className="tree-note">simulated customer</span></p>
            <p className="tree-depth-2">tasks/ <span className="tree-note">scenarios + hidden criteria</span></p>
            <p className="tree-depth-2">evaluation/ <span className="tree-note">outcome checks</span></p>
            <p className="tree-depth-2">evals/</p>
            <p className="tree-depth-2">rewards/</p>
            <p className="tree-depth-3">banking.ts</p>
            <p className="tree-depth-3">performance.ts</p>
            <p className="tree-depth-2">inspector/ <span className="tree-note">view run logs</span></p>
            <p className="tree-depth-2">cli/ <span className="tree-note">run experiments</span></p>
          </div>
          <div className="repo-modules" aria-label="What each workshop module does">
            <div><code>environment/</code><p>Adapted from τ³: bank state, tools, policies, and simulated customer.</p></div>
            <div><code>tasks/</code><p>10 original τ task records: starting state, customer scenario, and gold criteria.</p></div>
            <div><code>agents/</code><p>Your participant agent. Start with <strong>baseline/actor.ts</strong>.</p></div>
            <div><code>evals/ + rewards/</code><p>Check whether the outcome happened, then score the run.</p></div>
            <div><code>cli/ + inspector/</code><p>Run an experiment, then view its event log.</p></div>
          </div>
        </div>
      </section> : page === 8 ? <section className="environment-slide">
        <h2>the <span className="accent">environment</span></h2>
        <p className="environment-lead">A fresh, shared banking world for each run.</p>
        <div className="environment-layout">
          <div className="repo-tree environment-tree" aria-label="Banking environment file tree">
            <p><strong>environment/</strong></p>
            <p className="tree-depth-1">banking.ts</p>
            <p className="tree-depth-1">tools.ts</p>
            <p className="tree-depth-1">types.ts</p>
            <p className="tree-depth-1">base-db.json</p>
            <p className="tree-depth-1">customer/</p>
            <p className="tree-depth-2">agent.ts</p>
            <p className="tree-depth-1">knowledge/</p>
            <p className="tree-depth-2">index.ts</p>
            <p className="tree-depth-2">docs/ <span className="tree-note">698 policies</span></p>
            <p className="tree-depth-2">manifest.json</p>
          </div>
          <div className="environment-files" aria-label="Purpose of the environment files">
            <div><span className="environment-file-label"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m2 9 10-6 10 6M4 11h16M6 13v7m6-7v7m6-7v7M3 22h18"/></svg><code>banking.ts</code></span><p>Creates the world, exposes its tools, and resets state for each run.</p></div>
            <div><span className="environment-file-label"><svg viewBox="0 0 24 24" aria-hidden="true"><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 4 16 4 16 0V5M4 12c0 4 16 4 16 0"/></svg><code>base-db.json</code></span><p>Provides the canonical bank records before task-specific state is overlaid.</p></div>
            <div><span className="environment-file-label"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v16M12 5C8 2 4 3 2 4v15c4-1 7-1 10 2 3-3 6-3 10-2V4c-2-1-6-2-10 1Z"/></svg><code>knowledge/</code></span><p>Stores 698 policy documents; <code>index.ts</code> searches and reads them.</p></div>
            <div><span className="environment-file-label"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4a6 6 0 0 0-7 8L2 17a3 3 0 0 0 5 5l6-6a6 6 0 0 0 7-8l-4 4-4-4 4-4Z"/></svg><code>tools.ts</code></span><p>Implements validated reads and mutations: inspect, transfer, credit, report.</p></div>
            <div><span className="environment-file-label"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="7" r="4"/><path d="M4 22v-3a8 8 0 0 1 16 0v3"/></svg><code>customer/agent.ts</code></span><p>Runs a separate customer actor from the task’s private instructions.</p></div>
          </div>
        </div>
      </section> : page === 9 ? <section className="task-anatomy-slide">
        <h2>inside a <span className="accent">task</span></h2>
        <p className="task-id">TASK 093</p>
        <p className="task-summary">“Hi, I think there might be something wrong with my interest payments. I have a savings account with you and my monthly interest just seems... low? I'm not sure exactly what I should be getting but it doesn't feel right.”</p>
        <div className="task-anatomy-layout">
          <div className="task-scenario">
            <p className="task-id">TASK ANATOMY · JSONC</p>
            <pre className="task-anatomy-jsonc"><HighlightedCode source={taskAnatomyJsonc} /></pre>
          </div>
          <div className="task-criteria">
            <p className="task-id">TASK_093.JSON</p>
            <pre tabIndex={0} aria-label="Full task_093.json source"><HighlightedCode source={task093Source} language="json" /></pre>
          </div>
        </div>
      </section> : page === 10 ? <section className="run-task-slide">
        <h2>running a <span className="accent">task</span></h2>
        <p className="task-id">FOLLOW ALONG</p>
        <p className="run-task-command"><code>bun run cli run --cases task_093</code></p>
        <RunTaskFlow />
      </section> : page === 11 ? <section className="traditional-eval-slide">
        <h2>the traditional <span className="accent">eval</span></h2>
        <p className="run-task-command"><code>bun run cli eval runs/baseline/task_093.json</code></p>
        <p className="traditional-eval-example">TASK 093 · EXAMPLE</p>
        <p className="task-summary">“Hi, I think there might be something wrong with my interest payments. I have a savings account with you and my monthly interest just seems... low? I'm not sure exactly what I should be getting but it doesn't feel right.”</p>
        <div className="traditional-eval-scene" aria-label="Example initial and final bank states for Somchai Prasert">
          <div className="traditional-eval-state">
            <p className="traditional-eval-label">INITIAL STATE</p>
            <div className="traditional-eval-visual">
              <svg viewBox="0 0 88 88" aria-hidden="true"><circle cx="18" cy="32" r="9" /><path d="M3 69c1-17 7-25 15-25s14 8 15 25M38 34l23-17 23 17M41 38h40M45 41v25m11-25v25m11-25v25m10-25v25M39 70h44" /></svg>
              <div><strong>Somchai Prasert</strong><span>Silver savings account</span></div>
            </div>
            <dl className="traditional-eval-records">
              <div><dt>Balance</dt><dd>$144,000</dd></div>
              <div><dt>Interest correction</dt><dd>missing</dd></div>
              <div><dt>Discrepancy report</dt><dd>absent</dd></div>
            </dl>
          </div>
          <div className="traditional-eval-agent" aria-label="Agent actions">
            <p className="traditional-eval-label">AGENT ACTS</p>
            <strong>credit $33</strong>
            <strong>file report</strong>
            <span className="traditional-eval-arrow" aria-hidden="true">→</span>
          </div>
          <div className="traditional-eval-state traditional-eval-final">
            <p className="traditional-eval-label">FINAL STATE</p>
            <div className="traditional-eval-visual">
              <svg viewBox="0 0 88 88" aria-hidden="true"><circle cx="18" cy="32" r="9" /><path d="M3 69c1-17 7-25 15-25s14 8 15 25M38 34l23-17 23 17M41 38h40M45 41v25m11-25v25m11-25v25m10-25v25M39 70h44" /></svg>
              <div><strong>Somchai Prasert</strong><span>Silver savings account</span></div>
            </div>
            <dl className="traditional-eval-records">
              <div><dt>Balance</dt><dd>$144,033</dd></div>
              <div><dt>Interest correction</dt><dd className="traditional-eval-changed">+$33</dd></div>
              <div><dt>Discrepancy report</dt><dd className="traditional-eval-changed">filed</dd></div>
            </dl>
          </div>
        </div>
        <p className="traditional-eval-verdict">Compare the final bank state with the expected state <span aria-hidden="true">→</span> <strong>pass / fail</strong></p>
      </section> : page === 12 ? <section className="trajectory-question-slide">
        <h2>but how did it <span className="accent">get there?</span></h2>
        <p className="trajectory-question-example">TASK 093 · ILLUSTRATIVE ROUTES + METRICS</p>
        <svg className="trajectory-question-map" viewBox="0 0 1200 360" role="img" aria-label="A direct five-call route and a longer eight-call route share the same start and passing final state">
          <path className="trajectory-path trajectory-direct-path" d="M70 180 235 105 400 125 565 70 730 105 895 80 1130 180" />
          <path className="trajectory-path trajectory-wasteful-path" d="M70 180 190 255 310 225 430 290 550 245 670 305 790 250 910 290 1010 245 1130 180" />

          <g className="trajectory-shared-node" transform="translate(70 180)"><circle r="13" /><text y="-25">TASK START</text></g>
          <g className="trajectory-node" transform="translate(235 105)"><circle r="9" /><text y="-20">verify</text></g>
          <g className="trajectory-node" transform="translate(400 125)"><circle r="9" /><text y="28">inspect</text></g>
          <g className="trajectory-node" transform="translate(565 70)"><circle r="9" /><text y="-20">policy</text></g>
          <g className="trajectory-node" transform="translate(730 105)"><circle r="9" /><text y="-20">credit</text></g>
          <g className="trajectory-node" transform="translate(895 80)"><circle r="9" /><text y="-20">report</text></g>

          <g className="trajectory-node trajectory-wasteful-node" transform="translate(190 255)"><circle r="9" /><text y="28">verify</text></g>
          <g className="trajectory-node trajectory-wasteful-node" transform="translate(310 225)"><circle r="9" /><text y="-20">search</text></g>
          <g className="trajectory-node trajectory-wasteful-node" transform="translate(430 290)"><circle r="9" /><text y="28">inspect</text></g>
          <g className="trajectory-node trajectory-wasteful-node" transform="translate(550 245)"><circle r="9" /><text y="-20">reread</text></g>
          <g className="trajectory-node trajectory-wasteful-node" transform="translate(670 305)"><circle r="9" /><text y="28">search</text></g>
          <g className="trajectory-node trajectory-wasteful-node" transform="translate(790 250)"><circle r="9" /><text y="-20">reread</text></g>
          <g className="trajectory-node trajectory-wasteful-node" transform="translate(910 290)"><circle r="9" /><text y="28">credit</text></g>
          <g className="trajectory-node trajectory-wasteful-node" transform="translate(1010 245)"><circle r="9" /><text y="-20">report</text></g>

          <g className="trajectory-shared-node trajectory-goal-node" transform="translate(1130 180)"><circle r="17" /><text className="trajectory-final-label" y="-37">SAME FINAL STATE</text><text className="trajectory-final-value" y="38">+$33 · report filed · PASS</text></g>
        </svg>
        <div className="trajectory-question-metrics" aria-label="Illustrative route metrics">
          <p><span className="trajectory-direct-key">DIRECT</span><strong>18s</strong><strong>$0.04</strong><strong>5 tool calls</strong></p>
          <p><span>LONGER</span><strong>46s</strong><strong>$0.11</strong><strong>8 tool calls</strong></p>
        </div>
        <p className="trajectory-question-close">Are these equally good agents?</p>
      </section> : page === 13 ? <section className="trajectory-search-slide">
        <h2>How do we find the <span className="accent">best way</span><br />to get here?</h2>
        <p className="trajectory-search-example">TASK 093 · ILLUSTRATIVE ROUTES</p>
        <svg className="trajectory-search-map" viewBox="0 0 1200 410" role="img" aria-label="Ten possible forward-moving routes share the same task start and final state">
          <g className="trajectory-search-routes">
            <polyline points="55,205 190,54 380,72 555,38 745,82 930,58 1145,205" />
            <polyline points="55,205 170,88 315,118 470,74 650,116 810,66 985,112 1145,205" />
            <polyline points="55,205 210,132 410,150 610,105 830,142 1010,126 1145,205" />
            <polyline points="55,205 155,165 300,140 445,178 610,151 770,176 920,142 1040,166 1145,205" />
            <polyline points="55,205 205,190 390,218 570,180 760,210 940,182 1145,205" />
            <polyline points="55,205 175,235 340,208 500,252 670,218 850,248 1015,226 1145,205" />
            <polyline points="55,205 145,272 285,244 430,292 575,255 720,301 875,264 1020,284 1145,205" />
            <polyline points="55,205 185,318 355,282 525,326 700,286 870,330 1015,300 1145,205" />
            <polyline points="55,205 150,346 300,370 455,324 615,376 780,332 940,362 1060,318 1145,205" />
            <polyline points="55,205 230,380 420,352 590,392 765,354 950,384 1145,205" />
          </g>
          <g className="trajectory-search-nodes" aria-hidden="true">
            <circle cx="190" cy="54" r="6" /><circle cx="380" cy="72" r="6" /><circle cx="555" cy="38" r="6" /><circle cx="745" cy="82" r="6" /><circle cx="930" cy="58" r="6" />
            <circle cx="170" cy="88" r="6" /><circle cx="315" cy="118" r="6" /><circle cx="470" cy="74" r="6" /><circle cx="650" cy="116" r="6" /><circle cx="810" cy="66" r="6" /><circle cx="985" cy="112" r="6" />
            <circle cx="210" cy="132" r="6" /><circle cx="410" cy="150" r="6" /><circle cx="610" cy="105" r="6" /><circle cx="830" cy="142" r="6" /><circle cx="1010" cy="126" r="6" />
            <circle cx="155" cy="165" r="6" /><circle cx="300" cy="140" r="6" /><circle cx="445" cy="178" r="6" /><circle cx="610" cy="151" r="6" /><circle cx="770" cy="176" r="6" /><circle cx="920" cy="142" r="6" /><circle cx="1040" cy="166" r="6" />
            <circle cx="205" cy="190" r="6" /><circle cx="390" cy="218" r="6" /><circle cx="570" cy="180" r="6" /><circle cx="760" cy="210" r="6" /><circle cx="940" cy="182" r="6" />
            <circle cx="175" cy="235" r="6" /><circle cx="340" cy="208" r="6" /><circle cx="500" cy="252" r="6" /><circle cx="670" cy="218" r="6" /><circle cx="850" cy="248" r="6" /><circle cx="1015" cy="226" r="6" />
            <circle cx="145" cy="272" r="6" /><circle cx="285" cy="244" r="6" /><circle cx="430" cy="292" r="6" /><circle cx="575" cy="255" r="6" /><circle cx="720" cy="301" r="6" /><circle cx="875" cy="264" r="6" /><circle cx="1020" cy="284" r="6" />
            <circle cx="185" cy="318" r="6" /><circle cx="355" cy="282" r="6" /><circle cx="525" cy="326" r="6" /><circle cx="700" cy="286" r="6" /><circle cx="870" cy="330" r="6" /><circle cx="1015" cy="300" r="6" />
            <circle cx="150" cy="346" r="6" /><circle cx="300" cy="370" r="6" /><circle cx="455" cy="324" r="6" /><circle cx="615" cy="376" r="6" /><circle cx="780" cy="332" r="6" /><circle cx="940" cy="362" r="6" /><circle cx="1060" cy="318" r="6" />
            <circle cx="230" cy="380" r="6" /><circle cx="420" cy="352" r="6" /><circle cx="590" cy="392" r="6" /><circle cx="765" cy="354" r="6" /><circle cx="950" cy="384" r="6" />
          </g>
          <g className="trajectory-search-highlight" aria-hidden="true">
            <polyline points="55,205 205,190 390,218 570,180 760,210 940,182 1145,205" />
            <circle cx="205" cy="190" r="6" /><circle cx="390" cy="218" r="6" /><circle cx="570" cy="180" r="6" /><circle cx="760" cy="210" r="6" /><circle cx="940" cy="182" r="6" />
          </g>
          <g className="trajectory-search-endpoints">
            <circle cx="55" cy="205" r="13" /><text x="55" y="181">TASK START</text>
            <circle cx="1145" cy="205" r="18" /><text x="1145" y="171">SAME FINAL STATE</text><text className="trajectory-search-goal" x="1145" y="244">+$33 · report filed</text>
          </g>
        </svg>
      </section> : page === 14 ? <section className="reward-slide">
        <h2>enter <span className="accent">reward function</span></h2>
        <p className="reward-definition">A function that assigns a score to a run.</p>
        <div className="reward-expression" aria-label="Reward takes the task, trajectory, and final state and returns a score">
          <code><span className="accent">reward</span>(task, trajectory, finalState)</code>
          <span aria-hidden="true">→</span>
          <span className="accent">score</span>
        </div>
        <div className="reward-evidence">
          <div><h3>the outcome</h3><p>Was the missing interest credited and the report filed?</p></div>
          <div><h3>the trajectory</h3><p>What did the agent do along the way?</p></div>
        </div>
      </section> : page === 15 ? <section className="rl-slide">
        <p className="task-id">A QUICK DETOUR INTO</p>
        <h2>reinforcement <span className="accent">learning</span></h2>
        <div className="rl-layout">
          <div className="rl-concept">
            <div className="rl-loop" aria-label="The agent acts on the environment, which returns an observation and reward to the agent.">
              <span>agent</span><span className="rl-arrow">action →</span><span>environment</span>
            </div>
            <p className="rl-feedback">← observation + reward</p>
            <p className="rl-main">Try actions, get feedback, improve the policy.</p>
            <p className="rl-definition"><strong>Policy</strong> = its strategy for choosing actions.</p>
          </div>
          <div className="rl-example" aria-label="An illustrative agent trajectory receives a reward score of positive seven.">
            <p className="rl-example-label">ILLUSTRATIVE TRAJECTORY</p>
            <div className="rl-example-row">
              <svg className="rl-route" viewBox="0 0 180 220" role="img" aria-label="A jagged path through five trajectory states"><polyline points="90,16 45,58 130,102 60,153 105,204" /><circle cx="90" cy="16" r="8" /><circle cx="45" cy="58" r="7" /><circle cx="130" cy="102" r="7" /><circle cx="60" cy="153" r="7" /><circle cx="105" cy="204" r="10" /></svg>
              <span className="rl-score-arrow" aria-hidden="true">→</span>
              <div className="rl-score"><span>REWARD</span><strong>+7</strong></div>
            </div>
          </div>
        </div>
        <p className="reward-note"><a href="https://www.gatsby.ucl.ac.uk/~dayan/papers/dw01.pdf" target="_blank" rel="noreferrer">Dayan &amp; Watkins · Reinforcement Learning</a></p>
      </section> : page === 16 ? <Gridworld /> : page === 17 ? <AgentEnvironment /> : page === 18 ? <RewardInputs /> : page === 19 ? <TardigradeMotivation /> : page === 21 ? <RewardCode run={workshopRun} /> : null}
      <div className={page === 20 ? 'workshop-embedded-slide' : 'workshop-hidden'}><RunBankTask run={workshopRun} onRun={setWorkshopRun} /></div>
      <section className={page === 22 ? 'workshop-embedded-slide' : 'workshop-hidden'}><h2>score the <span className="accent">run.</span></h2><TransferScorer embedded initialRun={workshopRun} /><a className="flow-next" href="#23">Improve your agent →</a></section>
      {page === 23 && <ImproveBaseline />}
      {page === 24 && <RunChallenge />}
      {page === 25 && <CompareChallenge />}
      {page === 26 && <TauBenchHomework />}
      <nav className="slide-navigation" aria-label="Slide navigation" data-slide-navigation>
        <button type="button" onClick={() => goToPage(page - 1)} disabled={page === 1} aria-label="Previous slide">
          <span aria-hidden="true">←</span>
        </button>
        <button type="button" onClick={() => goToPage(page + 1)} disabled={page === pageCount} aria-label="Next slide">
          <span aria-hidden="true">→</span>
        </button>
      </nav>
      <span className="slide-position" aria-live="polite">{page} / {pageCount}</span>
    </main>
  )
}

const route = window.location.pathname.replace(/\/$/, '')
document.documentElement.classList.toggle('slide-mode', route !== '/events' && route !== '/rewards')
createRoot(document.getElementById('root')!).render(<StrictMode>{route === '/events' ? <EventViewer /> : route === '/rewards' ? <TransferScorer /> : <App />}</StrictMode>)
