# Mini τ banking

See the [setup guide](../README.md) to install dependencies and run a task.

`environment/`, `agents/`, `customer/`, and `tasks/` are shared. `evals/` contains expected answers, the response judge, and outcome checks. `rewards/` projects the execution log and scores outcomes, actions, time, and tokens.

The banking agent never receives the expected answers. Each run starts with fresh state and saves events and before/after snapshots. The harder interest task uses a scripted customer and deterministic checks instead of a response judge.
