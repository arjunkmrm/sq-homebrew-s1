import { useEffect, useRef, useState } from 'react'
import { ACTIONS, defaults, EPISODES, GOAL, HAZARD, HEIGHT, START, WIDTH, trainingEpisodes, type Attempt, type Move, type Rewards } from './q-learning'

const signed = (n: number) => `${n > 0 ? '+' : ''}${Number(n.toFixed(1))}`
const coord = (s: number) => `(${s % WIDTH}, ${Math.floor(s / WIDTH)})`

export function Gridworld() {
  const [rewards, setRewards] = useState<Rewards>(defaults)
  const [hazards, setHazards] = useState<number[]>([HAZARD])
  const [moves, setMoves] = useState<Move[] | null>(null)
  const [cursor, setCursor] = useState(0)
  const [training, setTraining] = useState(false)
  const [history, setHistory] = useState<Attempt[]>([])
  const [inspected, setInspected] = useState<number | null>(null)
  const [learned, setLearned] = useState<Move[] | null>(null)
  const [paused, setPaused] = useState(false)
  const pauseRef = useRef(false)
  const generation = useRef(0)
  useEffect(() => () => { generation.current++ }, [])
  const points = (path: Move[]) => [START, ...path.map(m => m.to)].map(s => `${(s % WIDTH + .5) * 100},${(Math.floor(s / WIDTH) + .5) * 100}`).join(' ')
  const recent = history.slice(-40)
  const bins = history.filter((_, i) => (i + 1) % 50 === 0).map(a => {
    const batch = history.slice(a.episode - 50, a.episode)
    return { episode: a.episode, value: batch.reduce((sum, x) => sum + x.total, 0) / batch.length }
  })
  const low = Math.min(-1, ...bins.map(b => b.value))
  const high = Math.max(1, ...bins.map(b => b.value))
  const chartPoints = bins.map(b => `${30 + b.episode / EPISODES * 420},${85 - (b.value - low) / (high - low) * 65}`).join(' ')
  function clearTraining() {
    setHistory([])
    setInspected(null)
    setLearned(null)
  }
  const last = moves?.[cursor - 1]
  const state = last?.to ?? START
  const total = moves?.slice(0, cursor).reduce((sum, m) => sum + m.reward, 0) ?? 0
  const visited = new Set([START, ...(moves?.slice(0, cursor).map(m => m.to) ?? [])])

  function update(key: keyof Rewards, value: number) {
    clearTraining()
    setRewards(r => ({ ...r, [key]: value }))
    setMoves(null)
    setCursor(0)
  }
  function toggleHazard(cell: number) {
    if (cell === START || cell === GOAL || training) return
    clearTraining()
    setHazards(current => current.includes(cell) ? current.filter(id => id !== cell) : [...current, cell])
    setMoves(null)
    setCursor(0)
  }
  async function learn() {
    const run = ++generation.current
    clearTraining()
    setMoves(null)
    setCursor(0)
    setPaused(false)
    pauseRef.current = false
    setTraining(true)
    const attempts: Attempt[] = []
    const learner = trainingEpisodes(rewards, hazards)
    let result = learner.next()
    while (!result.done) {
      if (generation.current !== run) return
      attempts.push(result.value)
      const episode = result.value.episode
      if (episode <= 10 || episode % 20 === 0 || episode === EPISODES) {
        const attempt = result.value
        setHistory([...attempts])
        setMoves(attempt.moves)
        setCursor(attempt.moves.length)
        setInspected(episode)
        await new Promise(resolve => setTimeout(resolve, episode <= 10 ? 240 : 40))
        while (pauseRef.current && generation.current === run) await new Promise(resolve => setTimeout(resolve, 60))
        if (generation.current !== run) return
      }
      result = learner.next()
    }
    setLearned(result.value)
    setMoves(result.value)
    setCursor(result.value.length)
    setInspected(null)
    setTraining(false)
  }
  function inspect(episode: number) {
    const attempt = history[episode - 1]
    if (!attempt) return
    setInspected(episode)
    setMoves(attempt.moves)
    setCursor(attempt.moves.length)
  }
  return <section className="grid-slide">
    <h2>learning from <span className="accent">rewards</span></h2>
    <div className="grid-layout">
      <div>
        <div className="grid-stage">
        <div className="grid-board" role="group" aria-label="Gridworld. Click cells to toggle hazards.">
          {Array.from({ length: WIDTH * HEIGHT }, (_, i) => <button type="button" key={i} onClick={() => toggleHazard(i)} disabled={training || i === START || i === GOAL} aria-pressed={hazards.includes(i)} aria-label={`${coord(i)}: ${i === START ? 'fixed start' : i === GOAL ? 'fixed goal' : hazards.includes(i) ? 'hazard, click to remove' : 'empty, click to add hazard'}`} className={`grid-cell ${hazards.includes(i) ? 'hazard' : ''} ${i === GOAL ? 'goal' : ''} ${visited.has(i) ? 'visited' : ''}`}>
            {i === state ? <span className="grid-agent" aria-hidden="true">●</span> : i === GOAL ? 'G' : hazards.includes(i) ? '×' : i === START ? 'S' : visited.has(i) ? '·' : ''}
          </button>)}
        </div>
        <svg className="training-trails" viewBox="0 0 700 500" preserveAspectRatio="none" aria-hidden="true">
          {recent.map(a => <polyline key={a.episode} points={points(a.moves)} fill="none" stroke="var(--moss)" strokeWidth="1.5" opacity=".09" />)}
          {moves && <polyline points={points(moves.slice(0, cursor))} fill="none" stroke="var(--moss)" strokeWidth="4" strokeLinejoin="round" opacity=".75" />}
        </svg>
        </div>
        <p className="grid-legend">● Agent · S Start · G Goal · × Hazard<br />Faint trails: last 40 attempts. Blue: current route.<br />Click any empty cell to add a hazard. Click × to remove it.</p>
        <dl className="grid-readout" aria-live="polite">
          <div><dt>State</dt><dd>{coord(state)}</dd></div>
          <div><dt>Action</dt><dd>{last ? ACTIONS[last.action] : '—'}</dd></div>
          <div><dt>Reward</dt><dd>{last ? signed(last.reward) : '—'}</dd></div>
          <div><dt>Return</dt><dd>{signed(total)}</dd></div>
        </dl>
      </div>
      <div className="grid-settings">
        {([
          ['goal', 'Goal reward', 1, 30, 1],
          ['step', 'Every step', -3, -.1, .1],
          ['hazard', 'Entering hazard', -12, 0, 1],
        ] as const).map(([key, label, min, max, step]) => <label key={key}>
          <span>{label}<output>{signed(rewards[key])}</output></span>
          <input type="range" min={min} max={max} step={step} value={rewards[key]} disabled={training} onChange={e => update(key, Number(e.target.value))} />
        </label>)}
        <div className="grid-buttons">
          <button onClick={learn} disabled={training}>{training ? 'Training…' : 'Train'}</button>
          <button onClick={() => setCursor(c => Math.min(c + 1, moves?.length ?? 0))} disabled={!moves || cursor >= moves.length || training}>Step</button>
          {training && <button onClick={() => { pauseRef.current = !pauseRef.current; setPaused(pauseRef.current) }}>{paused ? 'Resume' : 'Pause'}</button>}
          <button onClick={() => { setMoves(learned); setInspected(null); setCursor(learned?.length ?? 0) }} disabled={!learned || training}>Learned route</button>
          <button onClick={() => setCursor(0)} disabled={cursor === 0 || training}>Replay</button>
        </div>
        <p className="grid-status" role="status">{training ? `${paused ? 'Paused' : 'Exploring'} · episode ${history.length.toLocaleString()} / ${EPISODES.toLocaleString()}` : !moves ? 'Choose rewards and hazards, then train.' : inspected ? `Attempt ${inspected.toLocaleString()} · ${moves.length} steps · ${moves.at(-1)?.done ? 'reached goal' : 'step limit'}` : `Learned route · ${moves.length} steps · ${moves.at(-1)?.done ? 'reaches goal' : 'step limit'}`}</p>
        {history.length > 0 && <div className="training-history">
          <label><span>Inspect an attempt<output>{inspected ?? 'Learned'}</output></span><input type="range" min={1} max={history.length} value={inspected ?? history.length} disabled={training} onChange={e => inspect(Number(e.target.value))} /></label>
          <p className="training-chart-label">Mean return per 50 training episodes</p>
          <svg className="training-chart" viewBox="0 0 470 110" role="img" aria-label="Training return over episodes, averaged in groups of 50">
            <path d="M30 15V90H450" fill="none" stroke="var(--hair)" />
            <text x="25" y="23" textAnchor="end">{Math.round(high)}</text><text x="25" y="88" textAnchor="end">{Math.round(low)}</text>
            <text x="30" y="107">0</text><text x="450" y="107" textAnchor="end">4,000 episodes</text>
            <polyline points={chartPoints} fill="none" stroke="var(--moss)" strokeWidth="2" />
          </svg>
        </div>}
        <p className="grid-hint">Try hazard = 0, then hazard = −5.<br />Retrain each time. Does the route change?</p>
      </div>
    </div>
    <p className="grid-footnote">Shown paths are sampled training attempts, not all possible routes. Rewards add together on each move. The goal ends the episode; the hazard does not. Return = sum of rewards.<br /><a href="https://doi.org/10.1007/BF00992698" target="_blank" rel="noreferrer">Tabular Q-learning</a> · α = 0.2 · ε = 0.3 · γ = 1 · 100-step episode cap · fixed random seed</p>
  </section>
}
