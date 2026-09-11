# Interest investigation workshop task

This directory is a self-contained workshop adaptation of `banking_knowledge/task_097` from Sierra Research's public [tau2-bench repository](https://github.com/sierra-research/tau2-bench/tree/2174a603f6d014ef94473ffa95957f6ce27100db/data/tau2/domains/banking_knowledge). The source task and its required knowledge documents were consulted at commit `2174a603f6d014ef94473ffa95957f6ce27100db` on September 11, 2026.

The adaptation preserves the task's four savings accounts, checking accounts, credit cards, posted interest, product-specific APY matrices, nonstacking rules, verification, correction credits, and discrepancy reports. Task-owned initial data lives in `seed.ts`; the reusable environment in `../../environment/interest.ts` accepts it explicitly, uses integer cents, and keeps an ordered audit of accepted and rejected operations. Mutation tools enforce identity, account ownership, explicit consent, and credit-before-report ordering. They deliberately do not validate the target correction amounts or APYs; the reward code evaluates those outcomes independently.

The local knowledge module contains the original upstream document corpus and provides deterministic ranked retrieval. This remains a workshop runtime rather than an exact reproduction of Sierra's retrieval infrastructure.

Customer dialogue is task data in `scenario.ts`. The deterministic helper in `../../customer/interest.ts` uses it for repeatable multi-turn demonstrations and is less open-ended than the upstream model-driven user simulator.

This workshop does not produce or claim an official tau-bench score. Its results measure this local adaptation and reward implementation only.

Upstream material is used under the [MIT license](../../../notices/tau-bench-LICENSE).
