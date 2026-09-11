# Stop writing evals, start writing reward functions

Build a banking agent, run it against a simulated customer on 10 original τ banking tasks, and compare its trajectory with a reward function. Uses the public `tardie` npm package and **Bun 1.4+**.

## Start

```sh
git clone https://github.com/arjunkmrm/workshop.git
cd workshop
bun install --frozen-lockfile
cp .env.example .env
```

Set your API key and `TAU3_AGENT_MODEL` in `.env`. Start with the shared [`baseline agent`](mini-tau3/agents/baseline/actor.ts):

```sh
bun run run --cases task_097 --agent-file mini-tau3/agents/baseline/actor.ts --output runs/mine
bun run eval runs/mine/task_097.json
bun run score runs/mine/task_097.json
```

The baseline composes `context.instructions`, `context.tools`, and `context.output` with Tardie.

The customer is also an agent. Set `TAU3_CUSTOMER_MODEL` to keep its model fixed while changing banking models.

## Compare agents

Create your own agent file using the baseline composition, then:

```sh
bun run challenge --agents mini-tau3/agents/baseline/actor.ts,mini-tau3/agents/my-agent.ts --cases all --trials 1
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
├── evaluation/   # Shared reference state and outcome evaluator
├── evals/        # Pass/fail evaluation using that outcome
├── rewards/      # Same outcome + trajectory, time, and token scoring
├── trajectory.ts # Recorded events → trajectory
├── run.ts        # Run one agent and save its log
└── challenge.ts  # Compare agents across repeated runs
```

`bun run run --list-tasks` lists the tasks without calling a model. `bun run check` checks types and the environment. The slides live separately.

The [banking environment](mini-tau3/environment/README.md) ports the relevant τ tool contracts; this workshop's customer, retrieval, and rewards are adaptations, not an official benchmark score.
