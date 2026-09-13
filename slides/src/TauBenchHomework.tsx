// 2:1 isometric projection: x runs right-and-down, y left-and-down, z straight up.
const EX = [24, 12], EY = [-24, 12], EZ = [0, -26]
const project = (x: number, y: number, z: number): [number, number] =>
  [x * EX[0] + y * EY[0] + z * EZ[0], x * EX[1] + y * EY[1] + z * EZ[1]]
const face = (points: Array<[number, number, number]>) =>
  points.map(point => project(...point).map(value => value.toFixed(1)).join(' ')).join(' ')

// One podium block on the ground plane, drawn as its three visible faces.
function Block({ x, height, place }: { x: number; height: number; place: string }) {
  const top = face([[x, 0, height], [x + 1, 0, height], [x + 1, 1, height], [x, 1, height]])
  const right = face([[x + 1, 0, height], [x + 1, 1, height], [x + 1, 1, 0], [x + 1, 0, 0]])
  const front = face([[x, 1, height], [x + 1, 1, height], [x + 1, 1, 0], [x, 1, 0]])
  const [labelX, labelY] = project(x + 0.5, 1, height / 2)
  return <g>
    <polygon points={top} fill="var(--moss-wash)" />
    <polygon points={right} fill="var(--sunken)" />
    <polygon points={front} fill="var(--surface)" />
    <text x={labelX - 6} y={labelY + 6} fill="var(--moss-ink)" stroke="none" fontSize="15" fontFamily="var(--mono)">{place}</text>
  </g>
}

function Podium() {
  return <svg className="homework-podium" viewBox="-34 -62 116 114" role="img" aria-label="An isometric winners' podium, first place in the middle">
    <g fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round">
      <Block x={0} height={1} place="2" />
      <Block x={1} height={1.6} place="1" />
      <Block x={2} height={0.7} place="3" />
    </g>
  </svg>
}

export function TauBenchHomework() {
  return <section className="finish-slide homework-slide">
    <p className="finish-kicker">HOMEWORK</p>
    <h2>now go beat <span className="accent">τ-bench</span></h2>
    <div className="homework-layout">
      <div>
        <p className="homework-lead">You spent today on a ten-task mini-τ. The real benchmark is τ-bench: Sierra measures whether an agent can hold a conversation, call tools, retrieve knowledge and follow policy. Its τ³ banking domain, <code>banking_knowledge</code>, is the same shape as the environment you just worked in.</p>
        <ol className="homework-steps">
          <li><span>01</span><p>Get your agent past the baseline on all 10 workshop tasks.</p></li>
          <li><span>02</span><p>Run the real harness: <code>sierra-research/tau2-bench</code><small>τ³ ships from the τ² repo; Sierra never renamed it.</small></p></li>
          <li><span>03</span><p>Submit your result to the leaderboard.</p></li>
        </ol>
        <p className="homework-target">Ranked by <strong>Pass^1</strong>. On τ³-Banking the best published model sits at <strong>55.2%</strong> as of 13 Sep 2026, so roughly half of those conversations still fail. Plenty left to win.</p>
      </div>
      <div className="homework-aside">
        <Podium />
        <a className="homework-link" href="https://taubench.com" target="_blank" rel="noreferrer">
          <img src="/taubench-qr.svg" alt="QR code for taubench.com" />
          <span><small>LEADERBOARD</small>taubench.com</span>
        </a>
      </div>
    </div>
  </section>
}
