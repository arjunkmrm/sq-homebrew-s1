import { expect, test } from 'bun:test'
import { defaults, GOAL, HAZARD, train, transition } from '../src/q-learning'

test('rewards add on hazard and goal; terminal state cannot collect reward again', () => {
  expect(transition(16, 1, defaults).reward).toBe(-6)
  expect(transition(19, 1, defaults).reward).toBe(9)
  expect(transition(GOAL, 1, defaults)).toMatchObject({ reward: 0, done: true })
})
test('Q-learning chooses a safe detour when hazard is costly and direct path when free', () => {
  const safe = train(defaults)
  const direct = train({ ...defaults, hazard: 0 })
  expect(safe.at(-1)?.to).toBe(GOAL)
  expect(safe).toHaveLength(8)
  expect(safe.some(m => m.to === HAZARD)).toBe(false)
  expect(direct).toHaveLength(6)
  expect(direct.some(m => m.to === HAZARD)).toBe(true)
  expect(safe.reduce((s, m) => s + m.reward, 0)).toBe(2)
  expect(direct.reduce((s, m) => s + m.reward, 0)).toBe(4)
})

test('edited hazard layout drives both rewards and learned route', () => {
  expect(transition(16, 1, defaults, []).reward).toBe(-1)
  expect(transition(14, 1, defaults, [15]).reward).toBe(-6)
  const clear = train(defaults, [])
  expect(clear).toHaveLength(6)
  const edited = train(defaults, [15, 16, 17])
  expect(edited.at(-1)?.to).toBe(GOAL)
  expect(edited.some(m => [15, 16, 17].includes(m.to))).toBe(false)
})

test('training stream exposes real episodes with consistent rewards and transitions', async () => {
  const { trainingEpisodes, START, EPISODES } = await import('../src/q-learning')
  const learner = trainingEpisodes(defaults)
  let result = learner.next()
  let count = 0
  while (!result.done) {
    const attempt = result.value
    count++
    expect(attempt.episode).toBe(count)
    expect(attempt.moves[0]?.from).toBe(START)
    expect(attempt.total).toBe(attempt.moves.reduce((sum, move) => sum + move.reward, 0))
    if (count === 1 || count === EPISODES) {
      for (const move of attempt.moves) expect(move).toEqual(transition(move.from, move.action, defaults))
    }
    result = learner.next()
  }
  expect(count).toBe(EPISODES)
  expect(result.value).toEqual(train(defaults))
})
