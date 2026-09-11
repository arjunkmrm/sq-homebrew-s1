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

For the harder investigation over the original τ banking documents, use `--cases task_097`. Change the agent with `--agent-version baseline|concise|verify` or the model with `--agent-model provider:model`.

## Code

```text
mini-tau3/
├── environment/  # Shared bank state, tools, and policies
├── agents/       # Banking agent strategies
├── customer/     # Customer simulator
├── tasks/        # Scenarios and initial state
├── evals/        # Expected answers, judge, and state checks
├── rewards/      # Trajectory, outcome, time, and token scoring
└── run.ts        # Execute once and save the log
```

Conventional evals and rewards use the same environment and run. `eval` saves the conversation, snapshots, and conventional checks; `score` computes a reward from that saved log.

`bun run check` runs the remaining tests and TypeScript checks. The presentation is maintained separately.

The harder case is a [τ³ adaptation](mini-tau3/tasks/interest-investigation/README.md), not an official benchmark run.
