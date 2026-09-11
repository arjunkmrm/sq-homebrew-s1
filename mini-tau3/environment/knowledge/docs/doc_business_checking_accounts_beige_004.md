# Beige: Configuring Auto-Fund Sweeps

## Sweep objective
- Maintain target liquidity in operating accounts and move excess or deficit funds automatically based on a defined threshold.

## Threshold configuration
- Set the trigger threshold to $50,000. When an account falls below or rises above this level, the sweep initiates a transfer according to your direction.

## Source and destination eligibility
- Choose from your connected accounts, with a maximum of 30 eligible external sources or targets for sweep rules.

## Rule design
- Define whether sweeps top up to a target amount or move only the variance from the threshold.
- Specify which accounts can provide funds and which accounts can receive excess balances.
- Determine the evaluation timing, such as end of day, to align with your reconciliation cycle.

## Safeguards and testing
- Enable a dry-run mode if available to preview proposed movements without execution.
- Review proposed sweeps against recent transactions to avoid unintended overdrafts or duplicate funding.
- After enabling, verify that actual movements match the rule logic and reconcile the next day’s opening balances.
