# Mini τ banking

See the [setup guide](../README.md) to install dependencies and run a task.

- `bank/` — simulated state, seed data, policy, and tools
- `tasks/queries.json` — simple requests and expected answers
- `tasks/interest-investigation/` — multi-turn interest investigation
- `agents/` — baseline, concise, and verify strategies
- `eval/` — response judge and deterministic state checks
- `projections/` — raw events to trajectories
- `rewards/` — task completion, process, time, and token scoring
- `run.ts` — execute tasks and save logs

The response judge never shares expected answers with the banking agent. The harder task uses deterministic checks instead of a response judge. Every run starts from fresh state; saved logs contain events, before/after snapshots, and check results.
