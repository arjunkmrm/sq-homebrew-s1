# Internal: Submitting Interest Discrepancy Reports

When a customer's savings account interest calculation is incorrect, agents must submit an interest discrepancy report to the backend team for investigation. Use the submit_interest_discrepancy_report_7294 tool to create this report.

When to Submit a Report:

1. Missing APY Boost: Customer has a qualifying checking-savings account pairing but the linked checking APY boost was not applied to their interest calculation.

2. Incorrect Tier Rate: Customer's balance qualifies for a higher APY tier but the lower tier rate was applied.

3. Missing Relationship Bonus: Customer maintains multiple Rho-Bank products but the relationship bonus was not applied.

4. System Calculation Error: Any other discrepancy between expected and actual interest credited.

Tool: submit_interest_discrepancy_report_7294
Parameters:
- account_id (string): The savings account ID with the discrepancy
- user_id (string): The customer's unique identifier
- expected_apy (number): The APY percentage the customer should have received (e.g., 2.775 for 2.775%)
- actual_apy (number): The APY percentage that was actually applied (e.g., 2.5 for 2.5%)
- amount_difference (number): The dollar amount difference between expected and actual interest credited

Procedure:
1) Verify the customer's identity and account ownership
2) Look up the customer's accounts using get_all_user_accounts_by_user_id_3847
3) Check transaction history using get_bank_account_transactions_9173 to find the interest credit
4) Review documentation for the savings account type to determine all applicable APY components (base rate, tier rate, linked checking boost, credit card bonuses, relationship bonus)
5) Calculate the expected APY by adding all applicable components
6) Calculate the discrepancy between expected and actual interest
7) If a discrepancy exists, first apply a credit using apply_savings_account_credit_6831 to correct the customer's account
8) Then submit the discrepancy report using submit_interest_discrepancy_report_7294

Important: Always apply the credit to the customer's account BEFORE submitting the report. The report is for backend investigation to fix the underlying system issue, while the credit immediately resolves the customer's concern.