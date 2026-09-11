export const WIDTH = 7
export const HEIGHT = 5
export const START = 14
export const GOAL = 20
export const HAZARD = 17
export const ACTIONS = ['up', 'right', 'down', 'left'] as const
export type Rewards = { goal: number; step: number; hazard: number }
export type Move = { from: number; to: number; action: number; reward: number; done: boolean }
export const defaults: Rewards = { goal: 10, step: -1, hazard: -5 }
export const EPISODES = 4000
export const LIMIT = 100

export function transition(state: number, action: number, rewards: Rewards, hazards: readonly number[] = [HAZARD]): Move {
  if (state === GOAL) return { from: state, to: state, action, reward: 0, done: true }
  const x = state % WIDTH, y = Math.floor(state / WIDTH)
  const [dx, dy] = [[0, -1], [1, 0], [0, 1], [-1, 0]][action]!
  const to = Math.max(0, Math.min(HEIGHT - 1, y + dy)) * WIDTH + Math.max(0, Math.min(WIDTH - 1, x + dx))
  return { from: state, to, action, reward: rewards.step + (to === GOAL ? rewards.goal : 0) + (hazards.includes(to) ? rewards.hazard : 0), done: to === GOAL }
}
const best = (values: number[]) => values.indexOf(Math.max(...values))

// Tabular, epsilon-greedy Q-learning; terminal transitions have no bootstrap value.
// Watkins & Dayan (1992), https://doi.org/10.1007/BF00992698
export type Attempt = { episode: number; moves: Move[]; total: number }

export function* trainingEpisodes(rewards: Rewards, hazards: readonly number[] = [HAZARD]): Generator<Attempt, Move[]> {
  const q = Array.from({ length: WIDTH * HEIGHT }, () => [0, 0, 0, 0])
  let seed = 2026
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296 }
  for (let episode = 0; episode < EPISODES; episode++) {
    let state = START
    const attempt: Move[] = []
    for (let step = 0; step < LIMIT; step++) {
      const action = random() < .3 ? Math.floor(random() * 4) : best(q[state]!)
      const move = transition(state, action, rewards, hazards)
      q[state]![action]! += .2 * (move.reward + (move.done ? 0 : Math.max(...q[move.to]!)) - q[state]![action]!)
      attempt.push(move)
      state = move.to
      if (move.done) break
    }
    yield { episode: episode + 1, moves: attempt, total: attempt.reduce((sum, move) => sum + move.reward, 0) }
  }
  const moves: Move[] = []
  let state = START
  for (let i = 0; i < LIMIT; i++) {
    const move = transition(state, best(q[state]!), rewards, hazards)
    moves.push(move)
    state = move.to
    if (move.done) break
  }
  return moves
}

export function train(rewards: Rewards, hazards: readonly number[] = [HAZARD]) {
  const learner = trainingEpisodes(rewards, hazards)
  let result = learner.next()
  while (!result.done) result = learner.next()
  return result.value
}
