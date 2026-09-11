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
│   ├── evaluation/             # Shared outcome checks
│   ├── evals/                  # Pass/fail evaluation
│   ├── rewards/                # Outcome, trajectory, and cost scoring
│   ├── trajectory.ts           # Events → trajectory
│   ├── run.ts                  # Run an agent
│   └── challenge.ts            # Compare agents
└── runs/                       # Generated logs and results
```

## Step 2: meet the baseline

Open `mini-tau3/agents/baseline/actor.ts`.

It combines a short system prompt, document search/read, and banking tools. Everyone starts with this same agent. Leave it unchanged for the first run.

## Step 3: run it

```sh
bun run run \
  --cases task_093 \
  --agent-file mini-tau3/agents/baseline/actor.ts \
  --output runs/baseline
```

The agent investigates missing savings interest with a simulated customer. The log is saved to `runs/baseline/task_093.json`.
