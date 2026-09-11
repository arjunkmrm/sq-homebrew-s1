import './interest-task.css'

export function InterestTask() {
  return <section className="interest-task">
    <p className="interest-eyebrow">τ³ banking · task_097 · workshop adaptation</p>
    <h2>now, a harder <span className="accent">investigation.</span></h2>
    <blockquote>“The interest on all four of my savings accounts looks wrong. Can you check it and credit what I’m owed?”</blockquote>
    <div className="interest-scene">
      <div><span className="interest-number">4 + 4 + 5</span><h3>A whole portfolio</h3><p>Four savings accounts, four checking accounts, and five credit cards. Each product can affect the interest rate.</p></div>
      <div><span className="interest-number">?</span><h3>An unreliable starting point</h3><p>The customer’s remembered balances and expected interest are wrong. Look up the records and consult the policies.</p></div>
      <div><span className="interest-number">→</span><h3>More than an answer</h3><p>Verify identity, explain the calculation, obtain consent, credit each account, and file discrepancy reports.</p></div>
    </div>
    <footer><a href="https://github.com/sierra-research/tau2-bench/blob/main/data/tau2/domains/banking_knowledge/tasks.json" target="_blank" rel="noreferrer">Source: Sierra’s τ³ banking tasks ↗</a><a href="#20">Run the investigation →</a></footer>
  </section>
}
