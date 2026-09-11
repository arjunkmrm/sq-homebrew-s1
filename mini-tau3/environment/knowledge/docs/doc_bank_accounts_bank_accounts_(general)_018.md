# Internal: Retrieving Bank Account Transaction History

## Overview

Agents can retrieve the transaction history for a customer's bank account (checking or savings) using the get_bank_account_transactions_9173 tool. This is useful when reviewing account activity, verifying fees, checking for applied rebates, or investigating customer inquiries.

## Agent Tool Usage

- Tool: get_bank_account_transactions_9173(account_id)
  - account_id: The bank account ID to retrieve transactions for
  - Returns: A list of all transactions for the account. Transactions are returned in reverse chronological order (most recent first).

## Transaction Fields

Each transaction record contains the following fields:

- **transaction_id**: Unique identifier for the transaction
- **account_id**: The bank account ID this transaction belongs to
- **date**: Date of the transaction (MM/DD/YYYY format)
- **description**: Description of the transaction (e.g., 'ATM WITHDRAWAL - CHASE BANK #2847 CHICAGO IL')
- **amount**: Transaction amount in USD. Positive values are credits (money in), negative values are debits (money out)
- **type**: Transaction type, one of:
  - direct_deposit
  - debit_card_purchase
  - atm_withdrawal
  - atm_balance_inquiry
  - atm_fee
  - ach_transfer_in
  - ach_transfer_out
  - wire_transfer_in
  - wire_transfer_out
  - check_deposit
  - mobile_deposit
  - bill_pay
  - everyonepay
  - monthly_fee
  - overdraft_fee
  - fee_rebate
  - interest_credit
  - rebate_credit
  - fee_refund
- **status**: Transaction status, either 'posted' or 'pending'