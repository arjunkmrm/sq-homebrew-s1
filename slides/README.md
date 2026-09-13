# Workshop slides

Presentation and embedded viewers for the workshop. Lives in the same repository as the
mini-τ environment it imports from, under `slides/`.

From the repository root:

```sh
bun install --frozen-lockfile
bun run slides            # dev server, then open the printed URL
bun run slides:build      # type-check and build to slides/dist
```

The deck imports the environment, reward and inspector source directly from `../mini-tau3`,
so it always reflects the code attendees are editing.

## Recorded run

Live runs go through a Vite dev-server plugin, so a built deployment has no runner behind it.
The run slide and the scoring slide play back `public/runs/task-093-recorded.json`, a real
baseline run replayed from its saved log, and say so on the slide. Nothing on a deployed page
calls a model.

Re-record it after changing the agent, the environment or the reward:

```sh
bun run scripts/record-example.ts --model openrouter:openai/gpt-5.6-terra
```

That spends one real run and reads the repository-root `.env`. To package a run the workshop
CLI already produced, point at its output directory instead:
`bun run scripts/record-example.ts --from ../runs/<run>`.

## Deploying

```sh
bun run slides:build                                    # from the repository root
cd slides && wrangler pages deploy dist --project-name sq-homebrew-s1 --branch main
```

`public/_redirects` sends unknown paths to `index.html` so the `/events` and `/rewards`
routes resolve on a static host.
