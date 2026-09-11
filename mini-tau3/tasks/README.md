# Tasks

This folder contains ten original task records from the τ banking benchmark. Their customer scenarios, initialization data, reference actions, and required-document lists are retained. The TypeScript adapter uses the same shared environment for every task.

| Task | Challenge |
| --- | --- |
| `task_056` | Select business checking and savings accounts, then fund savings |
| `task_060` | Open savings before closing the checking account it depends on |
| `task_062` | Reorganize accounts through several order-dependent operations |
| `task_072` | Investigate ATM fees across two checking accounts |
| `task_074` | Reconcile 22 fee errors across four checking accounts |
| `task_093` | Investigate missing savings-rate bonuses |
| `task_094` | Correct a customer's mistaken rate assumptions |
| `task_095` | Find the correct combination of account and card bonuses |
| `task_096` | Investigate two savings products with different bonus rules |
| `task_097` | Investigate four savings products and correct every discrepancy |

The customer agent receives only the original private customer scenario. The banking agent receives its messages, policy access, and tool bindings. Reference actions and outcomes are evaluator inputs.

See [the upstream manifest](manifest.json) for the pinned revision and hashes, and [environment notes](../environment/README.md) for the scope of the TypeScript port. Scores are workshop rewards, not official τ results.
