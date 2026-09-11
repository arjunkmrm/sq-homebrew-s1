# Stop writing evals, start writing reward functions

Interactive slides and live banking agents for a hands-on reward functions workshop.

## Run

Requires **Git and Bun 1.4+**.

```sh
git clone https://github.com/arjunkmrm/workshop.git
cd workshop
bun run setup
bun run dev
```

Open the printed URL; navigate with **← / →**. Setup installs a pinned Tardigrade checkout at `../tardigrade`—keep it beside this repo. Slides and recorded demos need no API key.

## Live agents

Copy `.env.example` to `.env`, set your API key and `TAU3_AGENT_MODEL`, then restart `bun run dev`. Select **Configured default** in the app; Bedrock alternatives need their own gateway configuration.

## Code

- `slides/` — deck, chat, event viewer, and agent comparisons
- `mini-tau3/` — banking state, tasks, agents, projections, and reward functions

`bun run check` runs tests, type checks, and the build.

The harder banking task is a [τ³ adaptation](mini-tau3/tasks/interest-investigation/README.md), not an official benchmark run.
