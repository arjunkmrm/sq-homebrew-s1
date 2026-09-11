# Internal: Opening Business Savings Accounts

## Description

Procedure for opening business savings accounts. Eligibility requirements: 1) Customer must be verified, 2) Customer must already have at least one business checking account with status OPEN, 3) Customer cannot have more than 4 business savings accounts, 4) Customer must not have any accounts with negative balances, 5) Existing business checking account must have been open for at least 30 days, 6) Existing business checking account must have a balance of at least $2,500. Steps: 1) Verify customer identity, 2) Check eligibility requirements, 3) Confirm account selection with customer (business savings account_class options include Bronze Saver Account, Silver Saver Account, etc.), 4) Use open_bank_account_4821 to open the account, 5) Ask the customer if they would like you to transfer the opening deposit from their business checking account now. If yes, use transfer_funds_between_bank_accounts_7291 to transfer the required amount. If no, inform them they have 30 days to fund the account (via internal transfer or external deposit) or the account will be closed.

## Eligibility Requirements

Confirm all of the following before proceeding:
- Customer identity is verified.
- Customer has at least one business checking account with status OPEN.
- Customer has fewer than 4 existing business savings accounts.
- Customer has no accounts with negative balances.
- At least one existing business checking account has been open for at least 30 days.
- That business checking account has a current balance of at least $2,500.

Notes:
- Use the qualifying OPEN business checking account that meets both the tenure and balance thresholds as the source for the optional opening deposit transfer.

## Step-by-Step Procedure

1) Verify customer identity.
2) Check eligibility requirements (see list above).
3) Confirm account selection with the customer:
   - Ask for the desired business savings account_class (e.g., Bronze Saver Account, Silver Saver Account, etc.).
   - Ensure you capture the exact official account_class name ending with “Account.”
4) Open the new business savings account using the agent tool (see Tool Instructions below).
5) Funding the opening deposit:
   - Ask the customer if they want you to transfer the opening deposit now from their eligible business checking account.
   - If yes: initiate the internal transfer using the agent tool (see Tool Instructions below).
   - If no: inform the customer they have 30 days to fund the account via internal transfer or external deposit; otherwise, the account will be closed.

## Agent Tool Instructions

The AGENT calls these tools directly to perform actions on behalf of the customer. Do not expose tool details to the customer.

### Tool: open_bank_account_4821

- Signature:
  - open_bank_account_4821(user_id, account_type, account_class)
- When to call:
  - After eligibility is confirmed and the customer has selected the desired business savings account_class.
- How to call:
  - Set account_type to 'savings'.
  - Set account_class to the exact official name provided by the customer (e.g., 'Bronze Saver Account').
- Expected outcome:
  - Returns a new savings account record (capture the new account_id for subsequent actions).

### Tool: transfer_funds_between_bank_accounts_7291

- Signature:
  - transfer_funds_between_bank_accounts_7291(source_account_id, destination_account_id, amount)
- When to call:
  - Only if the customer authorizes transferring the opening deposit now.
- How to call:
  - source_account_id: the qualifying OPEN business checking account that meets the 30-day tenure and $2,500 balance requirements.
  - destination_account_id: the newly opened business savings account_id.
  - amount: the required opening deposit amount confirmed with the customer.
- If the transfer fails (e.g., insufficient funds):
  - Inform the customer and remind them they have 30 days to fund the account via internal transfer or external deposit, or the account will be closed.

## Checklist Before Opening

- Customer identity verified.
- OPEN business checking account identified and qualified (≥ 30 days open and ≥ $2,500 balance).
- Savings account count confirmed is < 4.
- No negative balances across any accounts.
- Customer-confirmed account_class captured exactly.

## Post-Opening Actions

- If the customer funds now: complete the transfer and confirm success.
- If the customer defers funding: clearly communicate the 30-day deadline and acceptable methods (internal transfer or external deposit), and note that the account will be closed if not funded within that timeframe.