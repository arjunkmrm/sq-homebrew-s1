# Mini τ banking

See the [setup guide](../README.md) to build and compare agents.

```text
evaluation/
  reference.ts   # Task reference actions → expected state
  outcome.ts     # Compare actual state with expected state
evals/
  evaluate.ts    # Return the shared outcome as pass/fail
rewards/
  banking-run.ts # Shared outcome + policy/trajectory/efficiency
  performance.ts # Time, tokens, and reported cost
  score.ts       # Evaluate a saved run, then reward it
```

Every task uses the same outcome evaluator. `run.ts` saves its result as `outcome`. A conventional eval reads that success definition; the reward adds verification, consent, errors, and efficiency without defining success again. Offline evaluation and scoring recompute the outcome from the saved snapshots.

```ts
const outcome = evaluateRun(task, run)
const passed = outcome.pass
const score = scoreBankingRun(task, run, outcome)
```

`environment/`, `tasks/`, `agents/`, `customer/`, and `trajectory.ts` are shared. Each attempt starts with fresh task state. The banking agent receives policy, tools, and customer messages; expected states stay in the evaluator. Customer model events are saved separately from banking-agent events.

The ten task records use τ's DB reward basis. Our outcome evaluator excludes verification and discovery bookkeeping tables; our reward checks policy evidence separately. These are workshop scores, not the official τ DB hash reward.
