# Workshop slides

Presentation and embedded viewers, maintained separately from the attendee repository.

Keep `../workshop` beside this directory, then run:

```sh
bun install --frozen-lockfile
bun run dev --port 5175
```

The mini-τ environment must also have its dependencies installed (`cd ../workshop && bun install --frozen-lockfile`). Live runs read `../workshop/.env`.

## Recorded run

Live runs go through a Vite dev-server plugin, so a built deployment has no runner behind it. The
run slide and the scoring slide fall back to `public/runs/task-093-recorded.json`, a real baseline
run replayed from its saved log, and say so on the slide. Nothing on a deployed page calls a model.

Re-record it after changing the agent, the environment or the reward:

```sh
bun run scripts/record-example.ts --model openrouter:openai/gpt-5.6-terra
```

That spends one real run. To package a run the workshop CLI already produced, point at its output
directory instead: `bun run scripts/record-example.ts --from ../workshop/runs/<run>`.
