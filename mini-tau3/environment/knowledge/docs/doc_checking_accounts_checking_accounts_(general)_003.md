# FAQ: Common Error Codes

## How to use this reference
Identify the error code, confirm the action the customer attempted, and follow the suggested resolution.

### Error reference
- Error 101 — Invalid account or routing details
  - Ask the customer to verify and re-enter account and routing numbers exactly as issued by their bank.
- Error 202 — Insufficient funds
  - Suggest depositing funds or reducing the payment or transfer amount, then retrying.
- Error 403 — Authentication failed
  - Have the customer reset their password and confirm they are signing in with the correct profile. Check for account security holds.
- Error 409 — Duplicate transaction request
  - Advise the customer to wait for the initial request to settle or cancel before attempting again.
- Error 429 — Too many attempts
  - Recommend waiting before retrying and ensuring details are correct to avoid rate limits.
- Error 903 — Account closure request blocked
  - This can occur when attempting to close an account. Instruct the customer to wait 48 hours and try again.

## If errors persist
- Capture screenshots, timestamps, and the exact workflow leading to the error.
- Verify device, browser, and app version details.
- Escalate with logs if multiple attempts produce the same result.

## Debit Card Decline Codes - Card Status and Validity Issues

The following decline codes indicate issues with the card's status or validity:

### CODE 05 - Do Not Honor (Generic Decline)

This is a catch-all code that requires investigation. Check the following IN ORDER:

1. **Card Status**: Look up the debit card information and check the card's status field.
   - If status is FROZEN → Ask customer if they want to unfreeze. If yes, follow the freezing/unfreezing card protocol.
   - If status is CLOSED → Inform customer this card is no longer active. Check if they have another active card or offer to order a replacement.
   - If status is PENDING → Card not yet activated. Follow protocol to activate it.
   - If status is ACTIVE → Continue to step 2.

2. **Account Status**: Look up the customer's accounts to check the linked checking account.
   - If account status is not OPEN → Inform customer their account has a restriction. DO NOT provide specific details if status is SUSPENDED or RESTRICTED. Say: 'Your account has a restriction that is preventing transactions. Please visit a branch or call our dedicated account services line at 1-800-RHO-ACCT for assistance.'

3. **Fraud Alert**: Check the card's fraud_alert_active field from the debit card lookup response.
   - If fraud_alert_active is TRUE and alert_source is 'customer_initiated' → Ask customer to verify recent transactions. If they confirm all transactions are legitimate, clear the alert.
   - IMPORTANT: If fraud_alert_active is TRUE and alert_source is 'bank_initiated' → Do NOT clear it. Say: 'I see there's a security flag on your account that requires additional review. I'm transferring you to our security team.' Then transfer to human agents.

4. **Velocity Block**: Check the card's velocity_blocked field from the debit card lookup response.
   - If velocity_blocked is TRUE, inform customer: 'Your card was temporarily blocked because our security system detected unusual activity patterns. This block automatically lifts after 30 minutes. Would you like me to verify your identity and lift it now?'
   - To lift early: Verify customer identity, then clear the velocity block.

### CODE 14 - Invalid Card Number

The card number entered doesn't match records. Possible causes:

1. **Typo**: Customer or merchant may have entered card number incorrectly. Ask customer to verify they're using the correct card.

2. **Card Replaced**: Customer may be using old card number after replacement.
   - Look up all debit cards for the account.
   - If there's a newer card with status ACTIVE and an older card with status CLOSED, inform customer: 'I see you received a new card on [date_issued]. The old card number is no longer valid. Please use your new card ending in [card_number_last_4].'
   - If new card is PENDING (not activated), help the user activate the card.

3. **Online Transaction with Old Saved Card**: Customer may have old card saved with merchant.
   - Advise: 'If you have card details saved with this merchant, you may need to update them with your new card information.'

### CODE 54 - Expired Card

The card has passed its expiration date.

1. Verify expiration: Look up the debit card information and check expiration_date field.

2. If card IS expired:
   - Check if replacement was already sent. Look for another card with issue_reason = 'expired' and status PENDING or ACTIVE.
   - If replacement exists and is PENDING: Guide through the appropriate activation protocol article.
   - If replacement exists and is ACTIVE: Customer may be using old card. Direct them to new card.
   - If NO replacement exists: 'It looks like your replacement card wasn't automatically sent. Let me order one for you now.' and call the appropriate tools to do so.

### CODE 56 - No Card Record

The card number format is valid but no record exists in Rho-Bank's system at all. This is different from Code 14 (invalid number) - here the number is valid but completely unknown.

1. **Possible Causes**:
   - Card was reported lost/stolen AND fully purged from the system (rare)
   - Customer is using a card from a different bank
   - Data entry error at merchant

2. Ask customer to verify they are using a Rho-Bank debit card (check for Rho-Bank logo).

3. Look up the debit cards for the account to see what cards exist.
   - If the card_number_last_4 from customer doesn't match any cards on file, the card may have been fully removed.
   - Offer to order a new card.