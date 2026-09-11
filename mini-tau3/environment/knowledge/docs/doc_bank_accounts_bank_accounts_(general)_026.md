# Internal: Freezing and Unfreezing a Debit Card

Procedure for when a customer wants to temporarily freeze or unfreeze their debit card.

## Freezing vs. Closing

- FREEZE: Temporary lock - card can be unfrozen later. Use when customer misplaced the card or wants temporary security.
- CLOSE: Permanent deactivation - cannot be reversed. Use when card is confirmed lost/stolen or customer wants to cancel.

## Reasons for Freezing

- Customer misplaced the card and is looking for it
- Traveling and wants extra security
- Suspicious activity noticed, wants to investigate before closing
- Temporarily restricting spending (e.g., budgeting purposes)
- Lending card to family member and wants to control usage

## Freezing Requirements

1. Customer must be verified
2. Customer must be the owner of the debit card
3. Card must currently be in ACTIVE status (cannot freeze PENDING, CLOSED, or already FROZEN cards)

## Freezing Steps

1. Verify customer identity
2. Ask customer why they want to freeze the card
3. Inform customer of the following:
   - All new transactions will be declined while frozen
   - Recurring payments/subscriptions will also be declined
   - Pending transactions already authorized may still process
   - They can unfreeze at any time by calling customer service or through the mobile app
4. Use freeze_debit_card_3892 with the card_id
5. Confirm the freeze was successful

## Unfreezing Requirements

1. Customer must be verified
2. Customer must be the owner of the debit card
3. Card must currently be in FROZEN status
4. The linked checking account must still be OPEN

## Unfreezing Steps

1. Verify customer identity
2. Use unfreeze_debit_card_3893 with the card_id
3. Confirm the card is now active and ready to use immediately

## Important Notes

- Freezing does not affect ATM access if the customer has their PIN
- For ATM freeze, customer must also enable 'ATM Block' separately through mobile app
- If a frozen card is not unfrozen within 90 days, the customer will receive a reminder notification
- If customer confirms the card is lost/stolen, recommend closing instead of freezing