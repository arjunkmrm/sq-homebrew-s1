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
