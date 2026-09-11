# Stop writing evals, start writing reward functions

Build a banking agent, run it against a simulated customer on 10 original τ banking tasks, and compare its trajectory with a reward function. Uses the public `tardie` npm package and **Bun 1.4+**.

## Start

```sh
git clone https://github.com/arjunkmrm/workshop.git
cd workshop
bun install --frozen-lockfile
cp .env.example .env
```

Set your API key and `TAU3_AGENT_MODEL` in `.env`. Edit [`mini-tau3/agents/participant.ts`](mini-tau3/agents/participant.ts), then run:

```sh
bun run eval --cases task_097 --agent-file mini-tau3/agents/participant.ts --output runs/mine
bun run score runs/mine/task_097.json
```

The starter uses `context.defineAgent(...)`. For a custom actor, compose `context.instructions`, `context.tools`, and `context.output` with Tardie.

The customer is also an agent. Set `TAU3_CUSTOMER_MODEL` to keep its model fixed while changing banking models.

## Compare agents

Copy the participant file to make another version, then:

```sh
bun run challenge --agents mini-tau3/agents/participant.ts,mini-tau3/agents/my-agent.ts --cases all --trials 1
```

Use `--cases task_060,task_097` for a smaller set and `--trials 3` for repeated comparisons. See the [10-task guide](mini-tau3/tasks/README.md).

Each attempt gets a fresh bank. The output folder contains individual logs and `leaderboard.json`: reward, completion, time, and tokens. Use the same agent and customer models for everyone's entries. These are trusted local agent files; the runner is not a submission sandbox.

## Find your way

```text
mini-tau3/
├── environment/  # Shared τ-style bank tables, tools, and 698 policy documents
├── agents/       # Your agent and reference strategies
├── customer/     # Customer simulator
├── tasks/        # Ten task JSONs and their loader
├── evals/        # Conventional answer and final-state checks
├── rewards/      # Outcome, trajectory, time, and token scoring
├── run.ts        # Run one agent and save its log
└── challenge.ts  # Compare agents across repeated runs
```

`bun run eval --list-tasks` lists the tasks without calling a model. `bun run check` checks types and the environment. The slides live separately.

The [banking environment](mini-tau3/environment/README.md) ports the relevant τ tool contracts; this workshop's customer, retrieval, and rewards are adaptations, not an official benchmark score.
