# Understanding Regulation E: Your Debit Card Consumer Protections

Regulation E is a federal regulation implemented by the Consumer Financial Protection Bureau (CFPB) that governs electronic fund transfers (EFTs) and provides important consumer protections for debit card transactions. As a Rho-Bank customer, understanding these protections can help you know your rights when issues arise with your debit card.

## What Regulation E Covers

Regulation E applies to electronic fund transfers including:
- Debit card purchases (both PIN and signature transactions)
- ATM withdrawals and deposits
- Direct deposits
- Automatic bill payments
- Person-to-person (P2P) transfers
- Recurring electronic payments

## Your Key Protections Under Regulation E

### 1. Limited Liability for Unauthorized Transactions

If someone uses your debit card without permission, your liability is limited based on how quickly you report it:
- **Within 2 business days**: Maximum $50 liability
- **Within 60 days**: Maximum $500 liability
- **After 60 days**: You may be liable for the full amount

### 2. Right to Dispute Errors

You have the right to dispute any error on your account, including:
- Unauthorized transactions
- Incorrect transaction amounts
- Missing deposits or transfers
- Computational errors
- Transactions that weren't completed as instructed

### 3. Investigation Requirements

When you report an error, Rho-Bank must:
- Investigate promptly (typically within 10 business days)
- Report results to you within 3 business days of completing the investigation
- Correct any confirmed errors within 1 business day of determination

### 4. Provisional Credit

For qualifying disputes, Rho-Bank must provide provisional (temporary) credit within 10 business days if the investigation takes longer than 10 business days. This ensures you're not left without access to your funds during the investigation.

### 5. Documentation Rights

You have the right to:
- Receive written confirmation of error resolution
- Request copies of documents used in the investigation
- Receive advance notice before provisional credit is reversed

## How to Exercise Your Regulation E Rights

To dispute an unauthorized or erroneous transaction:
1. Contact Rho-Bank customer service as soon as you notice the issue
2. Provide details about the transaction(s) in question
3. Follow up with a written statement if requested
4. Keep records of all communications

## Important Notes

- These protections apply specifically to debit card and electronic transactions, not credit cards (which are covered by different regulations)
- Business accounts may have different protections than personal accounts
- Promptly reviewing your statements helps you identify issues quickly and maximize your protections

## Decline Codes Related to Lost, Stolen, or Fraudulent Cards

When your debit card is declined due to security concerns, you may see one of the following decline codes. These codes are directly related to the protections described in this document.

### CODE 41 - Lost Card

Card was previously reported lost. Look up the debit card information to confirm - the card will have issue_reason = 'lost' or status will indicate lost.

1. Check if customer actually reported it: 'I see this card was reported lost. Did you report it lost?'

2. If customer says YES and found the card:
   - The old card CANNOT be reactivated once reported lost.
   - Check if replacement card was ordered by looking for another card in the response. If a replacement exists with status PENDING, guide through activation with the internal protocol.
   - If no replacement ordered, offer to help order one.

3. If customer says NO (they didn't report it):
   - SECURITY CONCERN: Someone else may have reported it.
   - Say: 'For your security, I need to verify some additional information.'
   - Ask security questions. If verified, this may indicate account compromise.
   - Review recent transaction history to check for suspicious activity.
   - Follow lost debit card protocol to help the customer.

### CODE 43 - Stolen Card (SECURITY SENSITIVE)

Card was reported stolen. This code requires EXTRA CAUTION.

1. DO NOT immediately offer to unfreeze or reactivate.

2. Verify customer identity using ENHANCED verification (not standard):
   - Full name, date of birth, AND
   - Last 4 of SSN, AND
   - Recent transaction verification - review transaction history and ask about 2-3 recent transactions

3. After enhanced verification, explain: 'This card was reported stolen. For security, stolen cards cannot be reactivated. I can order you a replacement card with a new number.' Follow protocol to order a new one.

4. If customer insists they never reported it stolen:
   - This is a MAJOR security flag. Someone may have access to their account.
   - Say: 'I understand this is frustrating. For your protection, I need to transfer you to our security team who can investigate this further.'
   - Use transfer_to_human_agents. Do NOT attempt to resolve this yourself.

### CODES NOT TO DISCLOSE (INTERNAL USE ONLY)

The following codes indicate fraud or security concerns. DO NOT tell the customer the specific code or reason:

- **CODE 04 - Capture Card (Pick Up)**: Say: 'I'm sorry, but I'm unable to process transactions on this card. For assistance, please visit a Rho-Bank branch with valid ID.' Use transfer_to_human_agents if customer presses for details.

- **CODE 07 - Pick Up Card (Special)**: Same response as Code 04.

- **CODE 34 - Suspected Fraud**: Say: 'There's a security matter affecting your card that requires in-person verification. Please visit a branch with your ID.' Do NOT attempt to clear or explain.

- **CODE 59 - Suspected Fraud**: Same as Code 34.

**NEVER** tell the customer their card has been flagged for fraud over the phone. This could tip off a fraudster who has stolen the card.