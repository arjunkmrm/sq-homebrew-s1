# Connecting Your ERP for Beige Account: API Integration Guide

## Prerequisites
- Confirm that your ERP is among the 18 supported platforms or prepare a custom API integration plan.
- Provision service credentials and restrict them to least-privilege access needed for synchronization and automation.

## Connection steps
- From your ERP, configure the banking connector or custom integration module.
- Authorize data access and select the accounts and entities that should sync.
- Map internal chart of accounts and vendor master data to bank account identifiers for reconciliation.

## Real-time data behavior
- Balance information is updated in real time: Yes.
- Design downstream processes to rely on current balances for posting, reconciliation, and exception handling.

## Throughput planning
- Plan your synchronization cadence to remain within $100,000.
- Use incremental sync patterns and cache stable reference data to reduce unnecessary calls.

## Testing and validation
- Perform read-only tests for balances, transactions, and payee data.
- Execute a limited end-to-end payment test and confirm ERP status updates reflect bank confirmation.
- Monitor call consumption against your monthly limit and tune polling intervals accordingly.

## Ongoing maintenance
- Rotate credentials on a regular schedule and monitor error logs for authentication or mapping issues.
- Version-control your integration configuration so changes can be rolled back if needed.
