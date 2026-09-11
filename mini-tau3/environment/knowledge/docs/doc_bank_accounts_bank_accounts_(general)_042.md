# Internal: Human Agent Transfer Reason Codes

## Overview

When using the transfer_to_human_agents tool, select the most accurate reason code from the tiered list below. Reasons are organized into 4 priority tiers - always select from the highest tier that applies.

## TIER 1 (HIGHEST PRIORITY) - Specific Functional/Operational Reasons

Use these when a specific operational scenario applies:

| Reason Code | When to Use |
|-------------|-------------|
| fraud_or_security_concern | Fraud, identity theft, unauthorized transactions, or security concerns requiring specialist handling |
| account_closure_request | Customer is explicitly requesting to close their account |
| deceased_account_holder | Customer needs to report a deceased account holder or handle estate matters |
| legal_or_regulatory_matter | Subpoena, court order, garnishment, or compliance-related inquiry |
| account_ownership_dispute | Ownership disputes, joint account issues, or identity verification failures requiring specialist |
| complex_billing_dispute | Billing disputes requiring specialist review (recurring charges, statement errors, fee reversals) |
| abusive_customer_behavior | Customer is being abusive, threatening, or using inappropriate language |
| third_party_inquiry | Attorney, power of attorney, or authorized representative inquiry requiring verification |
| technical_system_error | System error or outage preventing completion of the customer's request |
| customer_demands_after_unavailable_offer_refusal | Customer asked about offers/promotions that don't exist in the system, you informed them the offers aren't available, customer persisted multiple times, and now demands human |

## TIER 2 - Knowledge/Capability Gap Reasons

Use when the transfer is due to the agent's inability to find or verify information.

| Reason Code | When to Use |
|-------------|-------------|
| unconfirmed_external_communication | Customer claims a specific promotion/program/offer exists (they have a letter, email, or flyer) but you cannot verify or find it in the KB after searching |
| kb_search_unsuccessful_customer_requests_transfer | Customer asked for information or instructions that you searched for in KB but couldn't find, you informed customer, customer then requests transfer |
| specialized_department_required | Request requires specialized department (mortgage, investments, business banking) outside your scope of knowledge/tools |
| accessibility_or_special_needs | Customer needs accessibility accommodations or has special needs requiring human intervention |

## TIER 3 (LOWER PRIORITY) - Customer Disposition Reasons

These describe customer state rather than specific operational scenarios.

| Reason Code | When to Use |
|-------------|-------------|
| customer_frustrated_demands_human | Customer is frustrated and demands human, frustration is general |
| supervisor_request_service_complaint | Customer wants supervisor due to dissatisfaction with service quality (agent was rude, slow, unhelpful manner) |
| customer_requests_human_no_specific_reason | Customer requests human without clear reason, customer is not frustrated, just prefers human interaction |
| request_completed_customer_wants_human_followup | Agent completed the request successfully, but customer wants human for additional questions or confirmation |

## TIER 4 (LOWEST PRIORITY) - Catch-All

| Reason Code | When to Use |
|-------------|-------------|
| other | None of the above reasons apply. Provide detailed explanation in the summary field. |

