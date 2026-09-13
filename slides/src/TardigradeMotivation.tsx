export function TardigradeMotivation() {
  return <section className="tardigrade-motivation">
    <h2>why we built <span className="accent">Tardigrade</span></h2>
    <p className="motivation-thesis">To reward how an agent behaves,<br />we need a record of what it did.</p>
    <div className="motivation-flow" aria-label="Agent execution leads to a recorded trajectory, which feeds a reward function and an improvement loop.">
      <div className="motivation-stage"><h3>agent<br />execution</h3></div>
      <span className="motivation-arrow" aria-hidden="true">→</span>
      <div className="motivation-stage trajectory-stage">
        <p className="motivation-label">TARDIGRADE</p>
        <h3>recorded<br />trajectory</h3>
        <p className="trajectory-details">tool calls<br />results<br />state changes</p>
      </div>
      <span className="motivation-arrow" aria-hidden="true">→</span>
      <div className="motivation-stage"><h3>reward<br />function</h3></div>
      <span className="motivation-arrow" aria-hidden="true">→</span>
      <div className="motivation-stage"><h3>improvement<br />loop</h3></div>
    </div>
    <p className="motivation-close">One motivation: make agent execution something<br />we can inspect, score, and improve.</p>
  </section>
}
