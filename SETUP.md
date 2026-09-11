# Workshop setup

## Step 1: set up

Requires **Bun 1.4+**.

```sh
git clone https://github.com/arjunkmrm/workshop.git
cd workshop
bun install --frozen-lockfile
cp .env.example .env
```

Add your **OpenRouter API key** to `.env`:

```env
TAU3_AGENT_MODEL=openrouter:openai/gpt-5.1
OPENROUTER_API_KEY=your-openrouter-api-key
```

The `openrouter:` prefix means you need an OpenRouter key, even when using an OpenAI model.

```text
workshop/
├── .env                         # API key and model
├── mini-tau3/
│   ├── agents/baseline/
│   │   ├── actor.ts             # Agent composition
│   │   └── components/          # System prompt and tools
│   ├── environment/            # Bank state, tools, and policy documents
│   ├── tasks/                  # Ten banking tasks
│   ├── customer/               # Simulated customer agent
│   ├── inspector/              # React event viewer
│   ├── evaluation/             # Shared outcome checks
│   ├── evals/                  # Pass/fail evaluation
│   ├── rewards/                # Outcome, trajectory, and cost scoring
│   ├── trajectory.ts           # Events → trajectory
│   └── cli/                    # run, eval, score, inspect, challenge
└── runs/                       # Generated logs and results
```

## Step 2: meet the baseline

Open `mini-tau3/agents/baseline/actor.ts`.

It combines a short system prompt, document search/read, and banking tools. Everyone starts with this same agent. Leave it unchanged for the first run.

## Step 3: run it

```sh
bun run cli run \
  --cases task_093 \
  --agent-file mini-tau3/agents/baseline/actor.ts \
  --output runs/baseline
```

The agent investigates missing savings interest with a simulated customer. The log is saved to `runs/baseline/task_093.json`.

## Step 4: inspect the run

```sh
bun run cli inspect runs/baseline/task_093.json
```

Opens the React event viewer locally. Filter events, expand their JSON, or open another log. A `summary.json` lets you switch between runs. Press `Ctrl+C` to stop.

## Step 5: evaluate the outcome

```sh
bun run cli eval runs/baseline/task_093.json
```

Read `pass` and the individual `checks`. The evaluator compares the agent's final bank state with the expected state produced by the task's reference actions.

Open `mini-tau3/evals/evaluate.ts` to see the shared outcome check. This evaluation tells us whether the task succeeded; it does not inspect the path taken.

## Step 6: score the trajectory

```sh
bun run cli score runs/baseline/task_093.json
```

Open `mini-tau3/rewards/banking-run.ts`. The reward uses the same outcome check, then considers verification, consent, rejected operations, tool calls, time, and tokens.

Compare `total`, `completed`, and `checks` with the eval result. Both commands read the saved log; neither reruns the agent. Two runs can reach the same final state and receive different rewards.
