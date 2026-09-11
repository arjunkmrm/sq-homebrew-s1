const routes = Array.from({ length: 48 }, (_, route) => {
  let seed = route + 7
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296 }
  const count = 7 + route % 6
  const lane = (route / 47 - .5) * 310
  const stops = Array.from({ length: count }, (_, step) => {
    const progress = (step + 1) / (count + 1)
    return [60 + progress * 1160, 215 + Math.sin(progress * Math.PI) * (lane + (random() - .5) * 100)]
  })
  return [[60, 215], ...stops, [1220, 215]]
})

export function TrajectoryComplexity() {
  return <section className="complexity-slide">
    <h2>it gets complicated.<br /><span className="accent">quickly.</span></h2>
    <svg className="complexity-map" viewBox="0 0 1280 445" role="img" aria-labelledby="complexity-title complexity-desc">
      <title id="complexity-title">Many trajectories between the same start and goal</title>
      <desc id="complexity-desc">Forty-eight illustrative paths branch and overlap. Each has seven to twelve tool-call stops, always progressing left to right.</desc>
      {routes.map((points, i) => <g key={i} opacity={i === 8 || i === 37 ? .6 : .13}>
        <polyline points={points.map(p => p.join(',')).join(' ')} fill="none" stroke="var(--moss)" strokeWidth={i === 8 || i === 37 ? 2 : 1.2} strokeLinejoin="round" />
        {points.slice(1, -1).map(([x, y], j) => <circle key={j} cx={x} cy={y} r="3" fill="var(--bg)" stroke="var(--moss)" strokeWidth="1.3" />)}
      </g>)}
      <circle cx="60" cy="215" r="9" fill="var(--moss)" />
      <circle cx="1220" cy="215" r="9" fill="var(--moss)" />
      <text x="60" y="253" textAnchor="middle">start</text>
      <text x="1220" y="253" textAnchor="middle">goal</text>
      <text x="640" y="438" textAnchor="middle" className="complexity-caption">48 illustrative trajectories · each stop is a tool call</text>
    </svg>
    <p>How do we judge all of these consistently?</p>
  </section>
}
