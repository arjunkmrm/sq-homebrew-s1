# Workshop setup

## Step 1: install and configure

Requires **Bun 1.4+**.

```sh
git clone https://github.com/arjunkmrm/workshop.git
cd workshop
bun install --frozen-lockfile
cp .env.example .env
```

Open `.env` and add your **OpenRouter API key**:

```env
TAU3_AGENT_MODEL=openrouter:openai/gpt-5.1
OPENROUTER_API_KEY=your-openrouter-api-key
```

`TAU3_AGENT_MODEL` selects the model your agent uses. The `openrouter:` prefix sends requests through OpenRouter, so this configuration needs an **OpenRouter key**, not an OpenAI key—even though the selected model is from OpenAI.

Save `.env`. You're ready for the next step.

## Step 2: start with the baseline

Everyone starts with the same agent. Open `mini-tau3/agents/baseline/actor.ts`.

This composes three things:

- A short system prompt: help the customer and follow the bank's policies.
- Simple document search and a tool to read a full policy document.
- Banking tools for identity lookup, verification, and discovering and calling banking operations.

The composition is in `agents/baseline/actor.ts`; the system prompt is in `agents/baseline/components/instructions.ts`. Every task uses this same baseline. It contains no task-specific strategy or expected answers.

Leave it unchanged for the first run. We'll measure the baseline before improving it.

## Step 3: run the baseline

```sh
bun run run \
  --cases task_093 \
  --agent-file mini-tau3/agents/baseline/actor.ts \
  --output runs/baseline
```

The task asks the agent to investigate missing savings interest. The runner creates a fresh bank and a simulated customer, then lets them interact.

The result is saved to `runs/baseline/task_093.json`. Next, we'll inspect what happened before scoring it.
