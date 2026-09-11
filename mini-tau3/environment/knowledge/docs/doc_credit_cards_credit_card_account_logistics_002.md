# Internal: Processing Credit Card Account Closures

## Closure Process

1. Verify the customer's identity using standard verification procedures.
2. Confirm all eligibility requirements are met per 'How can I close a credit card account?':
   - Outstanding balance must be $0.00 dollars
   - No pending disputes (pending disputes allowed: No)
   - Account age at least 60 days
   - No pending replacement cards
3. Use the close_credit_card_account_7834 tool to process the closure. Refer to 'How can I close a credit card account?' for eligibility requirements.

### Tool Arguments

- credit_card_account_id (string): The unique identifier for the credit card account to be closed. This can be found in the customer's account profile or by looking up their credit card accounts.
- user_id (string): The unique identifier for the customer requesting the closure. This should match the authenticated user.

### Post-Closure Communication

- The customer will receive a confirmation email and a final statement within several business days after the account is closed.
- If asked, remind the customer:
  - Unredeemed rewards can be redeemed for 45 days after the closure request; thereafter, they are forfeited.
  - If an annual fee posted recently, a full refund may apply if the closure occurs within 37 days of the fee charge.