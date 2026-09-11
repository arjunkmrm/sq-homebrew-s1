export function RewardInputs() {
  return <section className="reward-input-slide">
    <h2>back to <span className="accent">reward functions</span></h2>
    <svg className="reward-input-diagram" viewBox="0 0 1320 490" role="img" aria-labelledby="reward-input-title reward-input-description">
      <title id="reward-input-title">The inputs and output of a reward function</title>
      <desc id="reward-input-description">Reward takes the task, trajectory, and final state, and returns a score. Task is the customer request and constraints. Trajectory records actions, tool results, and state changes. Final state is the resulting bank data. The score expresses our preferences for the run.</desc>
      <defs>
        <marker id="reward-input-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M1 1L6 4L1 7" fill="none" stroke="var(--moss)" strokeWidth="1.2" /></marker>
      </defs>
      <g className="reward-callouts" textAnchor="middle">
        <text x="325" y="54" className="input-label">THE TASK</text>
        <text x="325" y="89">Customer request + constraints</text>
        <text x="325" y="122" className="input-example">“Move $500 to checking.”</text>
        <text x="890" y="54" className="input-label">THE FINAL STATE</text>
        <text x="890" y="89">What’s in the bank afterward</text>
        <text x="890" y="122" className="input-example">Savings $3,000 · Checking $1,750</text>
        <text x="565" y="368" className="input-label">THE TRAJECTORY</text>
        <text x="565" y="403">Actions, tool results, state changes</text>
        <text x="565" y="436" className="input-example">lookup → transfer → lookup</text>
        <text x="1180" y="368" className="input-label">THE REWARD</text>
        <text x="1180" y="403">How we score the run</text>
        <text x="1180" y="436" className="input-example">e.g. +8.5</text>
      </g>
      <g fill="none" stroke="var(--moss)" strokeWidth="1.5" markerEnd="url(#reward-input-arrow)">
        <path d="M325 146V214" />
        <path d="M890 146V214" />
        <path d="M565 343V280" />
        <path d="M1180 343V280" />
      </g>
      <g className="annotated-equation" textAnchor="middle">
        <text x="112" y="257" className="function-name">reward</text>
        <text x="242" y="257">(</text>
        <text x="325" y="257">task</text>
        <text x="408" y="257">,</text>
        <text x="565" y="257">trajectory</text>
        <text x="724" y="257">,</text>
        <text x="890" y="257">finalState</text>
        <text x="1044" y="257">)</text>
        <text x="1098" y="257">→</text>
        <text x="1210" y="257" className="function-name">score</text>
      </g>
    </svg>
    <p className="reward-input-takeaway">The same scoring rules apply to every trajectory.</p>
  </section>
}
