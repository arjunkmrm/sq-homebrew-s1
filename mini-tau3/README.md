# Mini TAU3 bank eval

This workshop runs five banking requests through the baseline Tardie actor in `agents/baseline/actor.ts`. Each case starts from a fresh copy of `bank/seed`, so mutations cannot leak between cases. The runner saves the final response, raw Tardie events, a projected trajectory, bank snapshots before and after the turn, and a separate response-only reference judgment under `runs/`.

## Layout

```text
agents/baseline/actor.ts    Baseline agent composition
agents/baseline/components/instructions.ts
                            System instructions and bank policy
agents/baseline/components/bank-tools.ts
                            Bank tool bindings
bank/                      State, seed data, tools, and bank policy
tasks/queries.json         Customer requests and reference answers
projections/trajectory.ts  Execution log to trajectory
eval/                      Response judge and state checks
rewards/transfer.ts         Reward for the illustrative transfer traces
run.ts                     Execute cases and save run artifacts
```

The execution log remains the source of truth. Replaying the trajectory projection derives tool activity without making new model calls. The illustrative transfer reward accepts the normalized traces used in the early slides. `rewards/transfer-run.ts` scores actual execution logs; `efficient-run.ts` adds time and token costs, and `interest-run.ts` scores the harder investigation. The slides import this reward's executable code and display that same source.

The authenticated customer ID is bound by the runner and is absent from model-facing tool inputs. The banking agent never receives `expectedAnswer`. A separate judge receives the final response and reference after the banking turn finishes. Its prompt treats the candidate as untrusted data, accepts equivalent wording, requires case-specific facts, and saves a rationale. Runtime errors are recorded separately from valid judged failures, and each case file is written as soon as that case finishes.

Each case also gets deterministic state checks in `eval/state-checks.ts`. These inspect balances, account status, recorded transfers, and preservation of unrelated data using the before and after snapshots. Every check saves its name, pass/fail result, and detail under `stateChecks`. These checks run even when the agent or response judge fails.

The summary reports `responsePassed` and `statePassed` separately, making it possible to spot a convincing answer with an incorrect bank state. Overall `passed` requires both checks to pass and no runtime error. `failed` counts completed evaluations that fail either check; `errors` counts operational failures. State checks verify the resulting state, not the order of actions in the trajectory.

## Setup

Start with the [root setup guide](../README.md). Use Bun 1.4 or later; `bun run setup` at the repository root installs a pinned sibling `../../tardigrade` checkout. For CLI runs below, export credentials in your shell (the web server also reads the root `.env`).

```bash
export OPENAI_API_KEY=...
```

Use `OPENROUTER_API_KEY` for OpenRouter. Other OpenAI-compatible providers use `TAU3_<PROVIDER>_BASE_URL` and `TAU3_<PROVIDER>_API_KEY_ENV`, where the latter names the environment variable containing the credential. Provider credentials are read from the environment and are not written to run artifacts.

## Run

Validate inputs and case selection without model calls:

```bash
bun run run.ts --agent-model openai:gpt-5.1 --judge-model openai:gpt-5.1 --dry-run
```

Run all five cases:

```bash
bun run run.ts --agent-model openai:gpt-5.1 --judge-model openai:gpt-5.1
```

Select cases and an output directory:

```bash
bun run run.ts --agent-model openrouter:openai/gpt-5.1 --judge-model openrouter:openai/gpt-5.1 --cases check-savings-balance,transfer-over-balance --output runs/smoke
```

Each agent and judge call has a 120 second deadline. Set `--timeout-ms` or `TAU3_TIMEOUT_MS` to change it. The model values may be set with `TAU3_AGENT_MODEL` and `TAU3_JUDGE_MODEL`. Run `bun run check` for the offline tests and type check.

### View execution events

Start the workshop app with `cd ../slides && bun run dev`, then open `/events` on the printed local URL. Open a saved case JSON, `summary.json`, or a raw event array. The viewer keeps the imported data in browser memory and shows ordered raw events, the derived trajectory, and before/after bank snapshots. Reloading clears the imported data; no upload or backend service is needed.

Open `/rewards` to compare logs for `transfer-between-own-accounts`. Add multiple case files or summaries, or load the recorded baseline. The scorer recomputes completion from snapshots and events, charges every tool call. Adjusting the two reward weights rescales all loaded runs. Other task IDs and logs without snapshots cannot be scored by this task-specific reward function.

### Live workshop flow

Slides 13–16 follow: why Tardigrade → run and inspect the agent (Chat / Events / Code) → write the reward function → score and compare. The run views and scorer are embedded, retain their state while navigating, and share the workshop run.

On slide 14, **Run agent** calls the local Vite development endpoint for a fresh baseline transfer. The server uses your configured model credentials (including the existing Tardigrade `.env` gateway configuration); credentials stay server-side. Temporary runner files are removed after the response, and the deck keeps its log in memory. **Use recorded baseline** loads the earlier real run without invoking a model. Live execution needs `bun run dev`; the recorded baseline and scoring also work in the static build.

The run slide streams actual persisted events as the agent executes (polled every 100 ms), with expandable event details and a separate judging status. It is an event stream, not token-by-token model output. The completed log still carries through to the viewer and scorer. The local endpoint uses newline-delimited JSON when requested with `Accept: application/x-ndjson`; ordinary requests retain the complete JSON response.

### Compare agent versions

Slide 17 introduces `rewards/efficient-run.ts`: completion and tool cost plus elapsed agent time and input/output token usage. Estimated dollar cost is displayed separately, and missing measurements remain unknown. The judge is excluded from these measurements.

On slide 18, select Baseline, Concise, and/or Verify and click **Run selected agents**. Each request starts an independent Bun process with a fresh seed state and the same configured model. Their events stream concurrently; select a result to inspect its Chat or Events view. Reward weights can be adjusted after the runs finish.

The runner accepts `--agent-version baseline|concise|verify`. Descriptions live in `agents/variant-info.ts`; factories live in `agents/versions.ts`. The local endpoint accepts `?version=<id>` and permits up to three simultaneous runs.

The comparison slide uses a configuration table: choose an agent and model per row, expand **View code**, or **Duplicate** a row to compare models. Selected rows run through a three-worker queue. The local model list is served by `/api/banking-models`; the selected agent model is passed to `/api/banking-run?version=…&model=…`, while the judge keeps its configured model. The curated alternate model IDs are checked against the local Tardigrade catalog.

### Harder investigation

Slides 19–20 adapt τ³ banking `task_097`. Select `--cases task_097` to run it from the CLI. A scripted customer responds over multiple turns on one persistent thread; the run has a 240-second total deadline. Its deterministic checks replace the response-only judge. See [task notes](tasks/interest-investigation/README.md) for differences from the full benchmark.
