# Paying Off Credit Card Balance from Checking Account (Internal)

## Purpose

When a customer needs to pay off their credit card balance using funds from their Rho-Bank checking account, you can process the payment directly.

## Prerequisites

1. Verify the customer's identity using standard procedures.
2. Confirm the customer has a Rho-Bank checking account with sufficient funds to cover the payment amount.
3. Look up both the checking account and credit card account to obtain account IDs and verify balances.

## Process

1. Verify the customer's identity.
2. Look up the customer's checking account to confirm sufficient funds.
3. Look up the customer's credit card account to confirm the outstanding balance.
4. Confirm the payment amount with the customer and obtain authorization to transfer.
5. Unlock the pay_credit_card_from_checking_9182 tool using unlock_discoverable_agent_tool.
6. Call the tool using call_discoverable_agent_tool with the required arguments listed below.

## Tool Arguments for pay_credit_card_from_checking_9182

- user_id (string, required): The customer's unique identifier in the system.
- checking_account_id (string, required): The ID of the Rho-Bank checking account to debit.
- credit_card_account_id (string, required): The ID of the credit card account to credit.
- amount (float, required): The payment amount in dollars. Must be positive and cannot exceed the checking account balance or the credit card outstanding balance.

The tool will debit the specified amount from the checking account and reduce the credit card balance by the same amount. A confirmation will include the new balances for both accounts.

## Instructions for Passing the Tool

- Use unlock_discoverable_agent_tool to enable pay_credit_card_from_checking_9182 for the session.
- Then pass the arguments via call_discoverable_agent_tool exactly as listed above, ensuring the account IDs and user_id match the authenticated customer and the amount is authorized.