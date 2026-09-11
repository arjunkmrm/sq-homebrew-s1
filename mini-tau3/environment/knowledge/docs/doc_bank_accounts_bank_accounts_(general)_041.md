# Internal: PIN Lock Investigation Protocol - Fraud Risk Scoring

## Overview

When a debit card shows pin_locked = TRUE, agents must perform a comprehensive fraud risk assessment before unlocking. DO NOT REVEAL THE SPECIFIC CALCULATIONS TO USERS. This protocol uses a scoring system based on multiple flags derived from card data, transaction history, and customer verification.

## STEP 1: Check Automatic Escalation Triggers

Before calculating flags, check for these conditions that require IMMEDIATE escalation:

1. **Security Hold**: If pin_lock_reason = 'security_hold' → This card cannot be unlocked by chat agents. Offer to transfer the customer to the security team for this card.
2. **Other Cards Also Locked**: If another card on the same account also has pin_locked = TRUE → Finish investigating all cards before any unlock. Each card must be scored individually and may have different outcomes.
3. **Recent Stolen Card**: If any card on the account was replaced in last 90 days with issue_reason = 'stolen' → Enhanced verification required.

If any automatic trigger is present, follow that escalation path. Otherwise, proceed to Step 2.

## STEP 2: Calculate Fraud Risk Score

Review the declined transaction history (transactions with type 'atm_withdrawal_declined' or 'pos_declined') and card data to calculate the following flags:

### Category A: Location Flags

**A1. Location Mismatch** - Compare city in declined transaction description to customer's address city:
- Same city: 0 points
- Different city, same state: 1 point
- Different state: 2 points
- Different country: 3 points (CRITICAL)

**A2. Location Scatter** - Are declined attempts from same location or multiple different locations?
- All same location: 0 points
- 2 different locations: 1 point
- 3+ different locations: 2 points

**A3. Travel Pattern Conflict** - Check successful transactions from last 7 days:
- If all successful transactions were in customer's home city but declines are elsewhere: +1 point
- If customer has recent transactions in various cities (traveling): 0 points

### Category B: Time Flags

**B1. Time of Day** - Hour when declined transaction occurred:
- 6 AM - 10 PM: 0 points
- 10 PM - 12 AM: 1 point
- 12 AM - 2 AM: 2 points
- 2 AM - 6 AM: 3 points (HIGH RISK)

**B2. Time Since Last Legitimate PIN Use** - Compare to when the customer last successfully used their PIN:
- Less than 24 hours: 0 points
- 1-7 days: 0 points
- 7-30 days: 1 point
- More than 30 days: 2 points

**B3. Attempt Velocity** - Time between consecutive failed attempts:
- More than 5 minutes apart: 0 points
- 2-5 minutes apart: 1 point
- 1-2 minutes apart: 2 points
- Less than 1 minute apart: 3 points (SCRIPTED ATTACK)

### Category C: Amount Flags

**C1. Amount Pattern** - Compare amounts across consecutive failed attempts:
- Consistent amounts (same amount retried): 0 points
- Increasing amounts: 0 points
- Decreasing amounts (e.g., 800→500→300): 2 points (FRAUD PATTERN)

**C2. Round Number Testing** - Are all attempted amounts suspiciously round?
- Mixed amounts: 0 points
- All round hundreds (800, 500, 300, etc.): 1 point

**C3. Amount vs Historical Average** - Calculate customer's average ATM withdrawal from recent successful transactions:
- Attempted amount within 2x average: 0 points
- Attempted amount 2-5x average: 1 point
- Attempted amount more than 5x average: 2 points

**C4. Amount vs Daily Limit** - Compare attempted amount to card's daily ATM withdrawal limit:
- Less than 50% of limit: 0 points
- 50-80% of limit: 0 points
- 80-100% of limit: 1 point
- Multiple attempts totaling more than daily limit: 2 points

### Category D: Card History Flags

**D1. Lock Frequency** - Check how many times this card's PIN has been locked in the last 90 days:
- 0 prior locks: 0 points
- 1 prior lock: 1 point
- 2 prior locks: 2 points
- 3+ prior locks: 3 points (AUTOMATIC PIN RESET REQUIRED - cannot unlock)

**D2. Card Age** - Calculate how long the card has been active:
- More than 1 year: 0 points
- 6-12 months: 0 points
- 3-6 months: 0 points
- 1-3 months: 1 point
- Less than 1 month: 2 points

**D3. Other Card Issues** - Check if the customer's other debit cards have any security flags:
- All other cards have no issues: 0 points
- Another card has a velocity block: +1 point
- Another card has a fraud alert active: +2 points

### Category E: Account Flags

**E1. Account Age** - Calculate how long the account has been open:
- More than 2 years: 0 points
- 1-2 years: 0 points
- 6-12 months: 0 points
- 3-6 months: 1 point
- Less than 3 months: 2 points

**E2. Overdraft History** - Check for overdraft fees in recent transaction history:
- No overdrafts: 0 points
- 1 overdraft: 1 point
- 2+ overdrafts: 2 points

**E3. Low Balance Alert** - Check the account's current balance:
- More than $500: 0 points
- $100-500: 0 points
- $50-100: 1 point
- Less than $50: 2 points (account may be abandoned/compromised)

## STEP 3: Apply Score Thresholds

After calculating total score from all applicable flags:

| Total Score | Risk Level | Required Protocol |
|-------------|------------|-------------------|
| 0-4 | LOW | Unlock after standard identity verification |
| 5-7 | MEDIUM | Unlock only after asking: 'I see failed PIN attempts on your card. Were those attempts yours?' |
| 8-10 | HIGH | Must ask specific questions about location and time. Only unlock if customer confirms AND provides satisfactory explanation. |
| 11-14 | VERY HIGH | Cannot unlock on this call. Require callback verification OR enhanced verification (last 4 SSN + security question). |
| 15+ | CRITICAL | CANNOT unlock. Check for successful unauthorized transactions. Recommend card closure and replacement. |

### Single Flag Escalation

If ANY single flag equals 3 points, escalate to supervisor review regardless of total score.

## STEP 4: Customer Verification Questions

For scores of 5 or higher, ask these questions based on flags present:

**If Location Mismatch flag is scored:**
'I see your card was locked after failed PIN attempts at [location from transaction]. Were you at that location?'
- If customer says YES: Remove location flags, recalculate score.
- If customer says NO: Maintain score, proceed with caution.

**If Amount Pattern flag is scored:**
'The attempts were for [amount 1], then [amount 2], then [amount 3]. Do you remember trying those specific amounts?'
- If customer confirms: Remove amount pattern flag.
- If customer denies or seems confused: Maintain flag.

**If Time of Day flag is scored (2+ points):**
'These attempts occurred at [time]. Were you trying to use your card at that time?'
- If customer confirms: Remove time flag.
- If customer says 'I was asleep' or similar: CRITICAL - likely fraud.

## STEP 5: Post-Unlock Requirements

After unlocking (for eligible cases), complete these steps based on D1 Lock Frequency:

- **0 prior locks**: Standard unlock, no additional steps.
- **1 prior lock**: After unlock, MUST offer: 'Would you like me to enable PIN lock notifications so you're alerted if this happens again?'
- **2 prior locks**: After unlock, MUST ask: 'This is your third PIN lock in 90 days. Would you like me to reset your PIN to a new number? Frequent locks sometimes indicate the current PIN is difficult to remember.'
- **3+ prior locks**: Cannot unlock. Must reset PIN.

## STEP 6: If Cannot Unlock

For scores above thresholds or automatic escalation triggers:

1. Check transaction history for any successful unauthorized transactions during the suspicious period.
2. If unauthorized transactions found: File dispute, close card, order replacement.
3. If no unauthorized transactions: Explain the security concern and offer options:
   - Card closure and replacement (recommended if fraud suspected)
   - Transfer to security team for investigation
   - PIN reset (issues new PIN, invalidates potential compromise)