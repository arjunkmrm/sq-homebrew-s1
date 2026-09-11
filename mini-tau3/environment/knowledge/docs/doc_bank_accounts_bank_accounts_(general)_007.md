# Internal: Closing Business Checking Accounts

## Pre-Closure Requirements

Verify all of the following before closing:
- If an early closure fee applies, the account balance must be at least the fee amount; otherwise, account balance (current_holdings) must be $0. The fee is deducted directly from the account balance and there is no alternative payment method.
- Account status is OPEN
- No pending transactions for this account
- Customer has no linked business savings accounts that are still OPEN (close those first)

## Tier-Specific Closure Requirements

- ENTRY TIER (Navy Blue)
  - Early closure fee: $50 if closed within 60 days
  - Notice period: 7 days

- MID TIER (True Blue, Sky Blue)
  - Early closure fee: $100 if closed within 90 days
  - Notice period: 14 days

- PREMIUM TIER (Cobalt Blue)
  - Early closure fee: $200 if closed within 180 days
  - Notice period: 21 days
  - Requires supervisor review

- ELITE TIER (accounts with credit lines over $100,000)
  - Early closure fee: $400 if closed within 270 days
  - Notice period: 30 days
  - Requires manager approval

## Closure Procedure

1. Verify pre-closure requirements are met.
2. Determine the account tier and applicable fees/notice period.
3. For PREMIUM tier, obtain supervisor review. For ELITE tier, obtain manager approval.
4. Use close_bank_account_7392 to close the account.