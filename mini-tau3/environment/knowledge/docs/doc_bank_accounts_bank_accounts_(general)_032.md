# Internal: Debit Card Provisional Credit Guidelines

Under Regulation E, Rho-Bank is REQUIRED to provide provisional credit for debit card disputes under certain conditions. 

**Timeline for Provisional Credit:**
- Standard accounts: Must issue within 10 business days of dispute filing
- New accounts (open less than 30 days): Must issue within 20 business days

**Provisional Credit is REQUIRED when ALL of these conditions are met:**

1. **Timely Reporting**: Customer reported the unauthorized transaction within 60 days of the statement date showing the transaction

2. **Dispute Category**: The dispute is for one of these categories:
   - 'unauthorized_transaction'
   - 'card_present_fraud'
   - 'card_not_present_fraud'
   - 'atm_cash_discrepancy'
   - 'duplicate_charge'

3. **Written Statement**: Customer has provided a written statement describing the unauthorized transaction

4. **Account Standing**: The checking account is in OPEN status with no holds or restrictions

**Provisional Credit is NOT REQUIRED (but may be offered at discretion) when:**

1. The dispute category is:
   - 'goods_services_not_received'
   - 'recurring_charge_after_cancellation'
   - 'atm_deposit_not_credited'
   - 'incorrect_amount'

2. Customer has not contacted merchant first (for non-fraud disputes)

3. Customer shared their PIN voluntarily (pin_compromised = 'yes_shared')

4. Account is less than 30 days old AND the dispute is for a card-not-present transaction

**Provisional Credit Amounts:**

Unlike credit cards which have tiered maximum amounts, debit card provisional credit is for the FULL disputed amount, subject to:
- Maximum: The full transaction amount
- Liability offset: If customer reported late, reduce by their liability amount ($50 or $500)

**Investigation Timeline with Provisional Credit:**

When provisional credit is issued, the bank has 45 business days to complete the investigation (extended from 10 days). For international transactions, POS transactions at merchants outside the US, or new accounts, the timeline extends to 90 days.

**If Investigation Finds Against Customer:**

If the investigation determines the transaction was authorized or the claim is invalid:
1. Provisional credit will be reversed
2. Customer will be notified in writing at least 3 business days before reversal
3. Customer has the right to request documentation supporting the finding