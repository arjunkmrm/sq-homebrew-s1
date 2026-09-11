# Mini τ banking

See the [setup guide](../README.md) to build and compare agents.

Both conventional evals and rewards use the same environment and saved run. Each attempt starts with fresh task state. The banking agent receives policy, tools, and customer messages; expected answers and scoring targets stay in the evaluator.

Each task uses a separate customer agent. Its events are saved separately so its model usage does not count toward the banking agent's efficiency score.

All ten task records declare `reward_basis: ["DB"]`: τ compares the database produced by reference actions with the agent's database. Our shared evaluator compares business state, while workshop rewards separately score verification/consent evidence and efficiency. Verification and discovery-log tables are excluded from our business-state comparison, so this is not an exact reproduction of the official DB hash reward.
