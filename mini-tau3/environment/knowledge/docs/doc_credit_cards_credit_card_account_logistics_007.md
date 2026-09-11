# Internal: Processing CLI Approvals and Denials

## Purpose

This document outlines the step-by-step workflow for agents to process CLI requests, including verification and final decision. These steps MUST be followed in the exact order listed.

## Step 0: Confirm Requested Amount is Within Limits

BEFORE submitting any CLI request, verify that the customer's requested increase amount is within the maximum allowed for their card tier. If the requested amount exceeds the limit, inform the customer of the maximum allowed and ask them to adjust their request. Do NOT submit a request that exceeds the tier limit.

## Step 1: Submit the CLI Request

Once the customer has confirmed a valid increase amount within their tier's limits, submit the request on their behalf using the submit_credit_limit_increase_request_7392 tool. This creates a formal record of the request before eligibility checks are performed. Eligibility checks are internal and not exposed to customers, so the submission must happen first.

### Tool Arguments: submit_credit_limit_increase_request_7392

- credit_card_account_id (string, required): The credit card account ID.
- user_id (string, required): The customer's unique identifier.
- requested_increase_amount (integer, required): The dollar amount by which to increase the credit limit (e.g., 1000 for a $1,000 increase).

## Step 2: Verify Basic Eligibility

After submitting the request, verify the customer meets all eligibility requirements. You MUST check ALL of the following eligibility criteria before making an approval or denial decision as this ensures complete audit records.

1. Account Age: Verify the account has been open for the minimum required days for their card tier.
2. Cooldown Period: Use the get_credit_limit_increase_history_4829 tool to check if the customer has submitted a request within the cooldown period for their card tier. If a request exists within this period, deny the new request and inform the customer when they will be eligible to submit again.
3. No Pending Disputes: Verify the account has no active disputes.
4. No Pending Replacement Cards: Verify there are no outstanding replacement card orders for this account. If a replacement is pending, the CLI cannot be processed until the replacement is delivered or cancelled.
5. Account Good Standing: The account must be current with no past-due balance.
6. Credit Utilization: Verify current utilization is below the maximum threshold for their card tier.

### Tool Arguments: get_credit_limit_increase_history_4829

- credit_card_account_id (string, required): The credit card account ID to check.

## Step 3: Verify Payment History and Requested Amount

.

## Step 4: Process the Decision

If all requirements are met and the requested amount is within limits:

1. Use the approve_credit_limit_increase_5847 tool to approve and apply the increase.

### Tool Arguments: approve_credit_limit_increase_5847

- credit_card_account_id (string, required): The credit card account ID.
- user_id (string, required): The customer's unique identifier.
- new_credit_limit (float, required): The new total credit limit to set.

If any requirements are not met:

1. Use the deny_credit_limit_increase_5848 tool to record the denial.

### Tool Arguments: deny_credit_limit_increase_5848

- credit_card_account_id (string, required): The credit card account ID.
- user_id (string, required): The customer's unique identifier.
- denial_reason (string, required): Must be one of: 'insufficient_account_age', 'cooldown_period_active', 'pending_disputes', 'pending_replacement_card', 'past_due_balance', 'high_utilization', 'insufficient_payment_history', 'requested_amount_exceeds_limit', 'other'.

## Step 5: Communicate the Decision

Inform the customer of the decision and provide next steps. For approvals, confirm the new credit limit. For denials, explain the reason and when they may be eligible to reapply.