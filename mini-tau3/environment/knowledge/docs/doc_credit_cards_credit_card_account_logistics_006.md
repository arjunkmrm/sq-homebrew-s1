# Internal: CLI Payment History and Approval Criteria

This document outlines the payment history requirements and maximum increase limits for CLI requests by card tier.

## Payment History Requirements

The required number of consecutive on-time payment months varies by card tier:

- Entry-tier cards: Requires 6 consecutive months of on-time payments.
- Mid-tier cards: Requires 3 consecutive months of on-time payments.
- Premium-tier cards: Requires 3 consecutive months of on-time payments.

Use the get_payment_history_6183 tool to verify the customer's payment history meets the requirement for their card tier.

## Tool Arguments for get_payment_history_6183

- credit_card_account_id (string, required): The credit card account ID to check.
- months (integer, required): Number of months of payment history to retrieve. Use the appropriate value based on the card tier.

## Maximum Credit Limit Increase Amounts

The maximum increase allowed per request depends on the card tier:

- Entry-tier cards: Maximum increase of 25% of current credit limit per request.
- Mid-tier cards: Maximum increase of 50% of current credit limit per request.
- Premium-tier cards: Maximum increase of 50% of current credit limit per request.

If the customer requests more than the maximum allowed for their tier, inform them of the maximum amount they are eligible for and ask if they would like to proceed with that amount instead.