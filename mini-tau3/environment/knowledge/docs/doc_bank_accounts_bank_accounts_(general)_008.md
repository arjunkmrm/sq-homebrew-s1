# Internal: Closing Business Savings Accounts

## Pre-Closure Requirements

Verify all of the following before closing:
- If an early closure fee applies, the account balance must be at least the fee amount; otherwise, account balance (current_holdings) must be $0. The fee is deducted directly from the account balance and there is no alternative payment method.
- Account status is OPEN
- No pending transactions for this account
- Customer must have at least one active business checking account remaining (business savings requires a linked business checking account)

## Tier-Specific Closure Requirements

- ENTRY TIER (Bronze Saver Account)
  - Early closure fee: $75 if closed within 90 days
  - Notice period: 10 days

- MID TIER (Silver Saver Account)
  - Early closure fee: $125 if closed within 120 days
  - Notice period: 14 days

- PREMIUM TIER (Gold Saver Account)
  - Early closure fee: $250 if closed within 180 days
  - Notice period: 21 days
  - Requires supervisor review

- ELITE TIER (Platinum Reserve Account)
  - Early closure fee: $500 if closed within 270 days
  - Notice period: 30 days
  - Requires manager approval

## Closure Procedure

1. Verify pre-closure requirements are met.
2. Determine the account tier and applicable fees/notice period.
3. For PREMIUM tier, obtain supervisor review. For ELITE tier, obtain manager approval.
4. Use close_bank_account_7392 to close the account.