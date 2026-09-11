# Internal: Activating a Debit Card

Procedure for when a customer has received their new debit card and wants to activate it with Rho-Bank customer service.

## IMPORTANT: Activation Tool Selection

There are THREE different activation tools depending on WHY the card was issued. You MUST use the correct tool based on the card's issue reason. Check the debit_cards table for the 'issue_reason' field or debit_card_orders table for the order reason.

- activate_debit_card_8291: Use for NEW cards (first-time card for this checking account, issue_reason = 'new_account' or 'first_card')
- activate_debit_card_8292: Use for REPLACEMENT cards (replacing lost/stolen/fraud cards, issue_reason = 'lost', 'stolen', or 'fraud')
- activate_debit_card_8293: Use for REISSUED cards (expiration renewal, damaged card, design upgrade, or bank-initiated, issue_reason = 'expired', 'damaged', 'upgrade', or 'bank_reissue')

Using the wrong activation tool will result in an error. Always verify the issue reason before selecting the tool.

## Activation Requirements

1. Customer must be verified
2. Customer must have the physical card in their possession
3. The debit card must be in PENDING status (not already ACTIVE)
4. The linked checking account must still be OPEN
5. Card must not be expired (check expiration_date)

## Required Information from Customer

- Last 4 digits of the debit card number (printed on the card)
- Card expiration date (MM/YY format)
- The 3-digit CVV on the back of the card

## Activation Steps

1. Verify customer identity using standard verification procedures
2. Look up the card in the debit_cards table and check the 'issue_reason' field to determine which activation tool to use
3. Ask customer for the last 4 digits of the card number
4. Ask customer for the card expiration date
5. Ask customer for the 3-digit CVV on the back
6. Verify the card details match the customer's account
7. Ask customer to set a 4-digit PIN for the card (must be exactly 4 digits, cannot be sequential like 1234 or repeating like 1111)
8. Use the CORRECT activation tool based on issue_reason:
   - For new cards: activate_debit_card_8291
   - For replacement cards (lost/stolen/fraud): activate_debit_card_8292
   - For reissued cards (expired/damaged/upgrade): activate_debit_card_8293
9. Confirm activation was successful

## Additional Steps for REPLACEMENT Cards (8292)

- After activation, remind customer to review recent transactions for any unauthorized charges
- Ask if they have noticed any suspicious activity on their account
- Recommend changing their online banking password if fraud was suspected

## Additional Steps for REISSUED Cards (8293)

- Inform customer that their old card will remain active for 24 hours as a grace period
- Remind them to update any recurring payments with the new card details if the card number changed

## Important Notes

- If the customer provides incorrect card details 2 times, the card will be locked for security and they must visit a branch in person
- Previous debit cards linked to the same account will be automatically deactivated when the new card is activated (except for reissued cards which have a 24-hour grace period)