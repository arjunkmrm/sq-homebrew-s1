export function ImproveBaseline() {
  return <section className="finish-slide improve-baseline-slide">
    <p className="finish-kicker">STEP 1</p>
    <h2>improve your <span className="accent">baseline</span></h2>
    <div className="improve-baseline-layout">
      <div className="finish-code-block"><code>cp -R mini-tau3/agents/baseline \<br />&nbsp;&nbsp;mini-tau3/agents/my-agent</code></div>
      <div className="finish-tree" aria-label="Files in the copied agent">
        <p><strong>my-agent/</strong></p>
        <p className="finish-depth-1"><strong>actor.ts</strong><span>compose the agent</span></p>
        <p className="finish-depth-1">components/</p>
        <p className="finish-depth-2"><strong>instructions.ts</strong><span>change the prompt</span></p>
        <p className="finish-depth-2"><strong>bank-tools.ts</strong><span>change tool exposure</span></p>
      </div>
      <div className="finish-guidance">
        <div><span>01</span><p>Inspect weak trajectories.</p></div>
        <div><span>02</span><p>Edit prompt, tools, or composition.</p></div>
        <div><span>03</span><p>Keep tasks, environment, models, and reward fixed.</p></div>
      </div>
    </div>
  </section>
}

export function RunChallenge() {
  return <section className="finish-slide run-challenge-slide">
    <p className="finish-kicker">STEP 2</p>
    <h2>run all <span className="accent">10 tasks</span></h2>
    <pre className="challenge-command"><code>bun run cli challenge \<br />{'  '}--agents mini-tau3/agents/baseline/actor.ts,mini-tau3/agents/my-agent/actor.ts \<br />{'  '}--cases all \<br />{'  '}--trials 1 \<br />{'  '}--output runs/challenge-1</code></pre>
    <div className="challenge-facts">
      <div><span>20 RUNS</span><p>10 fresh tasks × 2 agents</p></div>
      <div><span>PARALLEL</span><p>Up to 10 at once by default</p></div>
      <div><span>ARTIFACTS</span><p><code>summary.json</code> + individual logs</p></div>
    </div>
    <p className="challenge-note">Use <code>--concurrency 5</code> to lower parallelism. Use <code>--trials 3</code> for a more reliable comparison.</p>
  </section>
}

export function CompareChallenge() {
  return <section className="finish-slide compare-challenge-slide">
    <p className="finish-kicker">STEP 3</p>
    <h2>compare <span className="accent">challenge scores</span></h2>
    <div className="compare-challenge-layout">
      <div>
        <pre className="finish-code-block"><code>bun run cli inspect \<br />{'  '}runs/challenge-1/summary.json</code></pre>
        <p className="compare-file"><code>leaderboard.json</code> contains rankings and challenge metadata.</p>
      </div>
      <div className="leaderboard-placeholder">
        <p>LEADERBOARD · AFTER YOUR RUN</p>
        <table>
          <thead><tr><th>Rank</th><th>Agent</th><th>Completed</th><th>Avg reward</th></tr></thead>
          <tbody><tr><td>—</td><td>baseline</td><td>— / 10</td><td>—</td></tr><tr><td>—</td><td>my-agent</td><td>— / 10</td><td>—</td></tr></tbody>
        </table>
      </div>
    </div>
    <div className="compare-metrics"><p><strong>averageReward</strong><span>ranking metric; missing totals count as zero</span></p><p><strong>successful</strong><span>tasks that completed safely and exactly</span></p><p><strong>averageDurationMs + averageTokens</strong><span>reported when every attempt has measurements</span></p></div>
  </section>
}
