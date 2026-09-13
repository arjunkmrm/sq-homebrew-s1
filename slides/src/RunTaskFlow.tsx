export function RunTaskFlow() {
  return (
    <svg className="run-task-flow" viewBox="0 0 1200 420" role="img" aria-label="Prepare the task, run the customer and agent conversation with bank tools, then evaluate and save the run.">
      <defs>
        <marker id="run-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0 L8 4 L0 8 Z" />
        </marker>
      </defs>

      <text x="10" y="49" className="run-flow-section">01 · PREPARE</text>
      <text x="10" y="198" className="run-flow-section">02 · RUN</text>
      <text x="10" y="361" className="run-flow-section">03 · FINISH</text>

      <g className="run-flow-links">
        <path d="M660 84 V159" />
        <path d="M660 239 V324" />
        <path d="M435 199 H535" markerStart="url(#run-arrow)" />
        <path d="M785 199 H885" markerStart="url(#run-arrow)" />
      </g>
      <text x="680" y="122" className="run-flow-note">customer opens the conversation</text>
      <text x="680" y="292" className="run-flow-note">conversation ends</text>
      <text x="485" y="183" textAnchor="middle" className="run-flow-note">messages</text>
      <text x="835" y="183" textAnchor="middle" className="run-flow-note">calls / results</text>

      <g className="run-flow-node" transform="translate(380 10)">
        <rect width="560" height="74" />
        <text x="280" y="30" textAnchor="middle">Load task → create a fresh environment</text>
        <text x="280" y="55" textAnchor="middle" className="run-flow-detail">bank state + customer instructions + your agent</text>
      </g>

      <g className="run-flow-node" transform="translate(185 159)">
        <rect width="250" height="80" />
        <text x="125" y="33" textAnchor="middle">Customer</text>
        <text x="125" y="59" textAnchor="middle" className="run-flow-detail">follows the private scenario</text>
      </g>
      <g className="run-flow-node run-flow-active" transform="translate(535 159)">
        <rect width="250" height="80" />
        <text x="125" y="33" textAnchor="middle">Your agent</text>
        <text x="125" y="59" textAnchor="middle" className="run-flow-detail">asks, decides, acts</text>
      </g>
      <g className="run-flow-node" transform="translate(885 159)">
        <rect width="250" height="80" />
        <text x="125" y="33" textAnchor="middle">Bank tools</text>
        <text x="125" y="59" textAnchor="middle" className="run-flow-detail">search policies · read / update</text>
      </g>
      <text x="310" y="272" textAnchor="middle" className="run-flow-note">Repeat, recording every event.</text>

      <g className="run-flow-node" transform="translate(380 324)">
        <rect width="560" height="80" />
        <text x="280" y="33" textAnchor="middle">Check the outcome → save the run</text>
        <text x="280" y="59" textAnchor="middle" className="run-flow-detail">final state vs. reference · event log + result JSON</text>
      </g>
    </svg>
  )
}
