# Internal: Checking Debit Card Dispute Status

To retrieve a customer's debit card dispute history and check the status of open disputes, use the get_debit_dispute_status_7483 tool.

**Tool: get_debit_dispute_status_7483(user_id: str)**

Returns a list of all debit card disputes filed by the customer, including:
- dispute_id: Unique identifier for the dispute
- transaction_id: The disputed transaction
- account_id: The checking account involved
- dispute_category: Type of dispute
- disputed_amount: Amount in dispute
- filing_date: When the dispute was filed
- status: Current status (see below)
- provisional_credit_issued: Boolean
- provisional_credit_amount: Amount of provisional credit if issued
- provisional_credit_date: Date provisional credit was applied
- expected_resolution_date: Estimated completion date
- resolution: Final outcome (if resolved)
- resolution_date: Date of resolution (if resolved)

**Dispute Statuses:**
- OPEN: Dispute filed, investigation in progress
- PENDING_DOCUMENTATION: Waiting for customer to provide additional documentation (affidavit, police report, etc.)
- UNDER_REVIEW: Investigation complete, under final review
- PROVISIONAL_CREDIT_ISSUED: Provisional credit applied, investigation ongoing
- RESOLVED_CUSTOMER_FAVOR: Dispute resolved in customer's favor, credit is permanent
- RESOLVED_BANK_FAVOR: Investigation found transaction was valid, no credit issued
- RESOLVED_PARTIAL: Partial credit issued
- PROVISIONAL_REVERSED: Provisional credit was reversed after investigation
- CLOSED_NO_RESPONSE: Closed due to customer not providing required documentation

**Timeline Monitoring:**
When checking dispute status, verify that regulatory timelines are being met:
- Provisional credit should be issued within 10 days (20 for new accounts)
- Investigation should complete within 45 days (90 for international/POS)

If a dispute appears to be exceeding timelines, escalate to a supervisor.