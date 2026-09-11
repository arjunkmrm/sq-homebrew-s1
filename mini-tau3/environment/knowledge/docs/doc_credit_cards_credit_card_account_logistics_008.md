# Internal: Downgrading a Credit Card to a No-Annual-Fee Card

## When to Offer a Downgrade

Offer a downgrade in these scenarios:

1. Retention protocol: The customer wants to close due to annual fee concerns and has been a customer for less than 2 years (not eligible for annual fee waiver).
2. Customer request: The customer explicitly asks to downgrade to avoid annual fees.

## Available No-Annual-Fee Card Options

- Personal cards: Bronze Rewards Card (no annual fee)
- Business cards: Business Bronze Rewards Card (no annual fee)

Customers may only downgrade within the same category (personal to personal, business to business).

## Downgrade Process

1. Verify the customer's identity using standard procedures.
2. Confirm the customer wants to proceed and understands benefit changes.
3. Inform the customer that account history and credit line will be preserved, and rewards rates/benefits will change to match the new tier.
4. Use downgrade_credit_card_3847 to process the downgrade.

Tool arguments for downgrade_credit_card_3847:
- credit_card_account_id (string, required): The credit card account ID to downgrade.
- user_id (string, required): The customer's unique identifier.
- target_card_type (string, required): One of 'Bronze Rewards Card' (personal) or 'Business Bronze Rewards Card' (business).

## Important Notes

- Credit limit, account number, and account history are preserved during a downgrade.
- Unredeemed rewards points transfer at the same value.
- The downgrade takes effect immediately; the customer continues using the existing physical card until the new card arrives, typically within several business days.
- If the annual fee was paid recently, the customer may be eligible for a prorated refund.