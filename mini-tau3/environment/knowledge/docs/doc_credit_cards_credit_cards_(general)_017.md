# (Internal) Applying a Credit Card Statement Credit

## Purpose

When an agent needs to apply a statement credit to a customer's credit card account (for goodwill adjustments, promotional credits, fee reversals, or other account credits), use the apply_statement_credit_8472 tool. First unlock the tool using unlock_discoverable_agent_tool, then call it using call_discoverable_agent_tool with the tool name and a JSON string containing all required arguments.

## Steps to Apply a Statement Credit

1. Unlock the tool:
   - Call unlock_discoverable_agent_tool with the tool name apply_statement_credit_8472.

2. Prepare the arguments JSON:
   - Include all required fields exactly as specified in Tool Arguments below.

3. Call the tool:
   - Use call_discoverable_agent_tool with:
     - Tool name: apply_statement_credit_8472
     - Arguments: JSON string containing user_id, credit_card_account_id, amount, and reason

4. Confirm the result:
   - Verify the credit appears as a negative transaction in the customer’s credit card transaction history and reduces the statement balance.

## Tool Arguments

1. user_id (string, required) - The customer's unique user identifier in the system.

2. credit_card_account_id (string, required) - The credit card account ID to apply the credit to. This can be found by calling get_credit_card_accounts_by_user.

3. amount (number, required) - The credit amount in dollars. Must be a positive number (e.g., 25.00 for a $25 credit).

4. reason (string, required) - The reason for the statement credit. Must be exactly one of:
   - 'goodwill_adjustment': One-time courtesy credit for customer satisfaction
   - 'promotional_credit': Credit from a promotional offer or campaign
   - 'annual_fee_reversal': Reversal of an annual fee charge
   - 'late_fee_reversal': Reversal of a late payment fee
   - 'interest_charge_reversal': Reversal of interest charges
   - 'dispute_resolution': Credit issued as part of dispute resolution
   - 'price_match': Credit for a price match guarantee
   - 'retention_offer': Credit offered to retain a customer
   - 'error_correction': Credit to correct a billing error
   - 'other': Other reasons not covered above