# Internal: Closing Personal Savings Accounts

## Pre-Closure Requirements

Verify all of the following before closing:
- If an early closure fee applies, the account balance must be at least the fee amount; otherwise, account balance (current_holdings) must be $0. The fee is deducted directly from the account balance and there is no alternative payment method.
- Account status is OPEN
- No pending transactions for this account

## Tier-Specific Closure Requirements

- ENTRY TIER (Bronze Account)
  - Early closure fee: $20 if closed within 60 days
  - Notice period: 1 days

- MID TIER (Silver Account, Silver Plus Account)
  - Early closure fee: $35 if closed within 90 days
  - Notice period: 5 days

- PREMIUM TIER (Gold Account, Gold Plus Account, Gold Years Account)
  - Early closure fee: $75 if closed within 180 days
  - Notice period: 10 days

- ELITE TIER (Platinum Account, Platinum Plus Account, Diamond Elite Account)
  - Early closure fee: $150 if closed within 270 days
  - Notice period: 21 days
  - Requires manager approval

## Closure Procedure

1. Verify pre-closure requirements are met.
2. Determine the account tier and applicable fees/notice period.
3. For ELITE tier, obtain manager approval before proceeding.
4. Use close_bank_account_7392 to close the account.