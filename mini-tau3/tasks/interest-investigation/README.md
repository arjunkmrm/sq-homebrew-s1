# Interest investigation workshop task

This directory is a self-contained workshop adaptation of `banking_knowledge/task_097` from Sierra Research's public [tau2-bench repository](https://github.com/sierra-research/tau2-bench/tree/2174a603f6d014ef94473ffa95957f6ce27100db/data/tau2/domains/banking_knowledge). The source task and its required knowledge documents were consulted at commit `2174a603f6d014ef94473ffa95957f6ce27100db` on September 11, 2026.

The adaptation preserves the task's four savings accounts, checking accounts, credit cards, posted interest, product-specific APY matrices, nonstacking rules, verification, correction credits, and discrepancy reports. `environment.ts` uses integer cents and keeps an ordered audit of accepted and rejected operations. Mutation tools enforce identity, account ownership, explicit consent, and credit-before-report ordering. They deliberately do not validate the target correction amounts or APYs; the reward code evaluates those outcomes independently.

For a compact workshop surface, the upstream knowledge base is represented by eight curated retrievable documents rather than the full collection of roughly 700 documents. Their task-relevant rates and procedures are adapted from the upstream documents listed by task 097. Text and IDs are simplified, so this package should not be treated as an exact reproduction of Sierra's retrieval environment.

`customer.ts` is a deterministic scripted customer used for repeatable multi-turn demonstrations. It reacts to requests for identity, accounts, cards, and separate consent for credits and reports. It is less open-ended than the upstream model-driven user simulator.

This workshop does not produce or claim an official tau-bench score. Its results measure this local adaptation and reward implementation only.

Upstream material is used under the [MIT license](../../../notices/tau-bench-LICENSE).
