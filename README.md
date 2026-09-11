# Stop writing evals, start writing reward functions

A hands-on workshop: interactive slides, a tiny banking environment, live Tardigrade agents, event logs, and executable reward functions.

## Run locally

Requires **Git and Bun 1.4+**.

```sh
git clone https://github.com/arjunkmrm/workshop.git
cd workshop
bun run setup
bun run dev
```

Open the local URL printed by Vite. Use **← / →** to move between slides. The slides, gridworld training, and recorded transfer demo work without API credentials.

Setup installs dependencies and clones a **pinned Tardigrade revision** into `../tardigrade`. Keep the two directories beside each other; the workshop imports runtime source directly. Setup never replaces an existing checkout at another revision.

## Run live agents

```sh
cp .env.example .env
# Add your provider API key and set TAU3_AGENT_MODEL in .env.
bun run dev
```

Choose **Configured default** in the app to use that model. The named Bedrock alternatives require a compatible Bedrock gateway configuration. API keys stay in the local server. Live runs use your provider account; each run starts with fresh simulated bank state.

- **Slide 14:** run one agent; inspect Chat, Events, or Code.
- **Slide 18:** compare agent/model configurations, up to three concurrently.
- **Slides 19–20:** investigate interest across four savings accounts, with customer follow-ups, policy retrieval, and partial-credit rewards.

The harder case adapts [τ³ banking task_097](https://github.com/sierra-research/tau2-bench). It uses a smaller document set and a scripted customer; its reward is a workshop reward, not an official benchmark score. See [adaptation details](mini-tau3/tasks/interest-investigation/README.md).

## Explore or change it

```text
slides/                         React/Vite deck and embedded viewers
mini-tau3/bank/                  Simple banking state and tools
mini-tau3/tasks/                 Requests and the harder investigation
mini-tau3/agents/                Baseline, concise, and verify agents
mini-tau3/rewards/               Outcome, trajectory, time, and token scores
mini-tau3/projections/           Raw events → trajectory
```

Run `bun run check` for tests, type checks, and the slide build. `bun run build` produces static slides in `slides/dist`; live agent execution requires the development server.
