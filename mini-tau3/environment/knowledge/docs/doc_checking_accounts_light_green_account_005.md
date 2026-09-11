# Spending limits and safety features for minors

## Daily spending limit
- Card-based purchases are capped at $300 per day. Attempts above this threshold are declined to help prevent overspending.

## ATM cash access
- Cash withdrawals are limited to $150 per day at ATMs. This helps manage cash use while limiting exposure if a card is lost or stolen.

## EveryonePay transfers
- Person-to-person payments via EveryonePay are limited to $250 per day.

## Alerts for higher-value transactions
- Parent or guardian notifications are triggered for transactions at or above 62. Adjust your monitoring approach by aligning the alert threshold with typical spending patterns.

## Debit Card Decline Codes - Transaction Limits and Restrictions

The following decline codes indicate that a transaction was blocked due to limits or restrictions on the card:

### CODE 57 - Transaction Not Permitted to Cardholder

The card has restrictions that block this type of transaction. Check the card's restrictions from the debit card lookup:

1. **Merchant Category Code (MCC) Block** (check restricted_mccs field):
   - Common blocks: gambling (MCC 7995), adult content (MCC 5967), cryptocurrency (MCC 6051)
   - For gambling/adult: 'Your card has category restrictions that block this type of merchant. These restrictions can be modified through your account settings or by visiting a branch.'
   - IMPORTANT: Do NOT remove MCC blocks over the phone for gambling or adult content. Customer must do this themselves via app or in-branch. Say: 'For your protection, these specific restrictions can only be modified through our mobile app or by visiting a branch in person.'

2. **International Transactions Blocked** (check international_enabled field):
   - If international_enabled is FALSE and transaction was international:
   - 'International transactions are currently blocked on your card. Would you like me to enable them?'

3. **Online Transactions Blocked** (check online_enabled field):
   - If online_enabled is FALSE:
   - 'Online/card-not-present transactions are blocked on your card. Would you like to enable them?'

4. **Teen/Light Green Account Restrictions**:
   - If account_class is 'Light Green Account', there may be parental controls.
   - 'This account has parental controls that restrict certain transaction types. The primary account holder can modify these settings.'
   - Do NOT modify parental controls without the guardian's authorization.

### CODE 58 - Transaction Not Permitted to Terminal

Similar to Code 57, but the specific merchant TERMINAL is blocked rather than the merchant category. This typically indicates a flagged terminal.

1. This is NOT something the customer or agent can resolve - the terminal itself has been flagged.

2. Explain: 'This particular payment terminal has been flagged in our system. Your card should work at other terminals or merchants.'

3. Advise customer to try a different register at the same store, or a different merchant entirely.

4. If customer reports this happening at multiple unrelated terminals: This may indicate an issue with their card. Follow Code 05 diagnostic steps.

### CODE 61 - Exceeds Withdrawal Amount Limit

Transaction exceeds the card's daily purchase or ATM limit. Check limits from the debit card lookup:
- daily_purchase_limit: Maximum daily purchase amount
- daily_atm_limit: Maximum daily ATM withdrawal
- daily_purchase_used: Amount already used today
- daily_atm_used: ATM amount already used today

1. Calculate remaining: 'Your daily [purchase/ATM] limit is $[limit]. You've used $[used] today, leaving $[remaining] available.'

2. If customer needs higher limit:
   - **Temporary Increase**: Temporary increases last 24 hours.
   - **Permanent Increase**: Depends on account tier. Elite tier can request permanent increases. Tell customer: 'I can request a temporary increase that lasts 24 hours. Would you like me to do that?'

3. IMPORTANT: For ATM limits at non-Rho ATMs, the other bank's ATM may have its own lower limit that we cannot override.

### CODE 62 - Restricted Card

Card has geographic restrictions. Check allowed_regions and blocked_regions from the debit card lookup.

1. **Geographic Restriction**: Card may be region-locked.
   - If customer is traveling: 'Your card is currently restricted to [regions]. Since you're traveling to [location], I can add that region.'

2. **New Card Restriction**: If card was issued within last 24 hours (check date_issued):
   - 'New cards have a brief security hold while they're being set up in all systems. This should clear within 24 hours of activation.'

### CODE 65 - Activity Count Exceeded

Too many transactions in the current period. Check daily_transaction_count and daily_transaction_limit from the debit card lookup.

1. Explain: 'Your card allows [limit] transactions per day. You've made [count] transactions today.'

2. Transaction count limits are typically fixed and cannot be increased. Customer must wait until midnight for reset.

3. Alternative: If customer has multiple Rho-Bank accounts, they could use a different card.