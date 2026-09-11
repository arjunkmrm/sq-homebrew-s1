# Upstream fidelity

The canonical banking state and tool behavior in `banking.ts` are a TypeScript workshop port of Sierra Research's tau2-bench banking knowledge environment at commit `2174a603f6d014ef94473ffa95957f6ce27100db` (retrieved September 11, 2026).

The table envelope follows `data_model.py`. Relevant argument validation, string results, mutations, fixed clock, and deterministic IDs follow `tools.py`, `db_query.py`, and `utils.py`. The port currently covers the common identity tools and the discoverable account, transaction, transfer, opening, closure, checking-credit, savings-credit, and interest-report tools used by the included workshop tasks. It is not the complete upstream Python toolkit and does not produce an official tau-bench score.

The ten upstream task seeds overlay their unchanged initialization records on the original base database. Adapter audit entries are stored separately from `snapshot()` so they do not alter the upstream-shaped database state.

Workshop adaptations: deterministic local search over the original 698 Markdown documents; an independent Tardie customer actor with the original private customer scenario; a supported subset of tools rather than every banking workflow; and our own trajectory/efficiency reward. Neither the reward nor participant code is part of the official τ evaluator.

Source: [banking environment](https://github.com/sierra-research/tau2-bench/tree/2174a603f6d014ef94473ffa95957f6ce27100db/src/tau2/domains/banking_knowledge). Upstream material is covered by the repository's [MIT notice](../../notices/tau-bench-LICENSE).
