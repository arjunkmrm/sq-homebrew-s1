# Stop writing evals, start writing reward functions

A small banking environment with Tardigrade agents, execution logs, and reward functions. Uses the public `tardie` npm package; requires **Bun 1.4+**.

## Run

```sh
git clone https://github.com/arjunkmrm/workshop.git
cd workshop
bun install --frozen-lockfile
cp .env.example .env
```

Set your API key and `TAU3_AGENT_MODEL` in `.env`, then:

```sh
bun run eval --cases transfer-between-own-accounts --output runs/demo
bun run score runs/demo/transfer-between-own-accounts.json
```

For the harder investigation, use `--cases task_097`. Change the agent with `--agent-version baseline|concise|verify` or the model with `--agent-model provider:model`.

## Code

Everything lives in `mini-tau3/`: `bank/`, `tasks/`, `agents/`, `eval/`, `projections/`, and `rewards/`. Each run starts with fresh state and saves its events and results as JSON.

`bun run check` runs the remaining tests and TypeScript checks. The presentation is maintained separately.

The harder case is a [τ³ adaptation](mini-tau3/tasks/interest-investigation/README.md), not an official benchmark run.
