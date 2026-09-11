# Internal: Closing/Cancelling a Debit Card

Procedure for when a customer wants to close, cancel, or deactivate their debit card.

## Reasons for Closing a Debit Card

- Lost card
- Stolen card
- Suspected fraud/unauthorized transactions
- Damaged card (customer wants replacement)
- Customer no longer needs the card
- Closing the linked checking account

## Requirements

1. Customer must be verified
2. Customer must be the owner of the debit card (verify user_id matches)
3. The debit card must currently be in ACTIVE or PENDING status
4. No pending transactions: The card must not have any pending or processing transactions. If pending transactions exist, inform the customer they must wait for all transactions to settle before the card can be closed.
5. No pending refunds: The card must not have any pending refunds. If pending refunds exist, inform the customer they must wait for the refunds to process (typically 3-5 business days) or acknowledge in writing that the refunds will be credited to the linked checking account instead.
6. Minimum card age: The debit card must have been active for at least 14 days. Calculate this from the date_issued field. If the card is newer than this, inform the customer they cannot close the card yet and provide the earliest eligible closure date.

## Closing Steps

1. Verify customer identity using standard verification procedures
2. Ask customer for the reason they want to close the card (select from: lost, stolen, fraud_suspected, damaged, no_longer_needed, account_closing)
3. Check eligibility requirements. If any requirement is not met, inform the customer what needs to be resolved and do not proceed with closure.
4. If reason is 'lost', 'stolen', or 'fraud_suspected':
   - These reasons bypass the minimum card age requirement (requirement 6) for security purposes
   - Inform customer that any pending transactions will still be processed
   - Ask if they want to order a replacement card immediately
   - If fraud is suspected, advise customer to review recent transactions and file disputes for any unauthorized charges
5. Use close_debit_card_4721 to close the card with parameters: card_id, reason
6. Confirm the card has been closed and provide the following information:
   - The card is now permanently deactivated and cannot be reactivated
   - Any recurring payments linked to this card will need to be updated with new payment information
   - If they need a new card, they can order one through the standard ordering process

## Important Notes

- Cards reported as lost or stolen are closed immediately with no cooling-off period
- For fraud_suspected closures, recommend the customer also change their online banking password
- If the linked checking account is being closed, all associated debit cards must be closed first
- Closed cards cannot be reopened - customer must order a new card if needed
- Refunds to a closed card will be credited to the linked checking account