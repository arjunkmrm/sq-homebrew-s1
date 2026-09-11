# Internal: Managing Debit Card Security Alerts and Blocks

This document covers the procedures for managing security alerts and temporary blocks on debit cards. These protections are designed to prevent fraudulent transactions but may occasionally affect legitimate customers.

## Types of Security Protections

### Fraud Alerts

Fraud alerts are flags placed on debit cards when suspicious activity is detected or reported. There are two types:

1. **Customer-Initiated Alerts**: Placed when a customer reports suspicious activity or requests additional security. These can be cleared by customer service agents after verifying the customer's identity.

2. **Bank-Initiated Alerts**: Placed by Rho-Bank's fraud detection systems when high-risk patterns are identified. These CANNOT be cleared by customer service agents and require review by the security team.

### Velocity Blocks

Velocity blocks are automatic, temporary holds placed on cards when unusual transaction patterns are detected. Common triggers include:
- Multiple transactions in rapid succession
- Transactions in geographically distant locations within a short time
- Sudden changes in spending patterns
- Multiple declined transactions followed by successful ones

Velocity blocks automatically expire after 30 minutes, but can be cleared earlier by a customer service agent after identity verification.

## Clearing Security Protections

### Tool: clear_debit_card_fraud_alert_4892

Use this tool to clear fraud alerts or velocity blocks on a customer's debit card.

**Parameters:**
- `card_id` (required): The debit card ID to clear the alert/block for
- `reason` (required): The reason for clearing. Must be one of:
  - `'customer_verified'`: Use when clearing a customer-initiated fraud alert after the customer has verified their identity and confirmed their transactions are legitimate
  - `'velocity_clear'`: Use when clearing a velocity block after verifying the customer's identity

**Important Restrictions:**
- This tool CANNOT clear bank-initiated fraud alerts. If you attempt to clear a bank-initiated alert, you will receive an error. In this case, you must transfer the customer to the security team.
- Always verify the customer's identity before using this tool.
- Document why the alert/block was cleared in the interaction notes.

**Example Usage:**

To clear a velocity block:
```
clear_debit_card_fraud_alert_4892(card_id="dbc_12345", reason="velocity_clear")
```

To clear a customer-initiated fraud alert:
```
clear_debit_card_fraud_alert_4892(card_id="dbc_12345", reason="customer_verified")
```

## When to Clear vs. When to Escalate

**Clear the alert/block when:**
- Customer's identity is verified
- For fraud alerts: The alert was customer-initiated AND customer confirms their recent transactions are legitimate
- For velocity blocks: Customer provides a reasonable explanation for the unusual activity (e.g., shopping spree, travel)

**Escalate to security team when:**
- The fraud alert is bank-initiated (you'll receive an error if you try to clear it)
- Customer cannot verify their identity
- Customer reports transactions they did not make
- You suspect the person calling may not be the actual account holder
- The customer's explanation for unusual activity is suspicious or inconsistent