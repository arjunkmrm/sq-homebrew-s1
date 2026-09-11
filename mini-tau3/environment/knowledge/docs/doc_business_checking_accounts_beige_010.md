# Troubleshooting: Beige Fee and Balance Issues

## Quick Reference: Fees and Balance Thresholds

| Item | Amount | When it matters |
|---|---|---|
| Monthly maintenance fee | $200.00 | Charged if you do not meet the waiver balance threshold within the billing period |
| Fee waiver balance threshold | $500,000 | Balance required to waive the monthly maintenance fee |
| Minimum balance requirement | $250,000 | Balance required to maintain the enterprise-level treasury account |
| Domestic out-of-network ATM fee | $0.00 | Per transaction at non-Rho ATMs within the U.S. |
| Foreign ATM withdrawal fee | 1% of withdrawal amount, minimum $2.00 | Per withdrawal at international ATMs |

Note: The ATM section below addresses only fees charged by us.

---

## Troubleshooting an Unexpected Monthly Maintenance Fee

If you were charged $200.00 and expected a waiver:

1. Verify the waiver threshold was met
   - Confirm your Beige account balance met or exceeded $500,000 during the relevant billing period.
   - Do not confuse the waiver threshold with the minimum balance requirement; meeting $250,000 alone does not waive the fee.

2. Review fund movements that may have lowered your balance
   - Check liquidity rules, balance aggregation flows, and auto-fund movements that could have moved funds out of the account near period end.
   - Review API/ERP-triggered transfers and scheduled sweeps for the period.
   - Confirm dual authorization did not leave an inbound transfer pending at the time the balance was measured.

3. Reconcile timing
   - Compare timestamps of transfers with the date/time your period closed.
   - If transfers posted after the relevant cut-off, they would not count toward the waiver balance for that period.

4. Prevent recurrence
   - Maintain a buffer above $500,000 to account for intraday or end-of-day movements.
   - Adjust auto-movement rules or transfer windows so your Beige account remains above $500,000 when the balance is measured.
   - Ensure dual approvers are available to approve time-sensitive transfers.

5. Request a review if needed
   - If your records show the Beige account balance met $500,000 for the period and the fee still posted, provide the statement period, balance history, and transfer details for investigation.

---

## Troubleshooting Minimum Balance Issues

If your balance dipped below $250,000 unexpectedly:

- Review automated transfers and aggregation
  - Check whether liquidity tools or auto-fund rules moved funds out of the Beige account temporarily.
  - Confirm any planned replenishment transfers were executed and fully posted.

- Check approval status
  - Verify whether dual authorization delayed a transfer intended to keep the account above $250,000.

- Stabilize operationally
  - Increase the Beige account’s target buffer so routine sweeps and settlement variances do not push the balance below $250,000.
  - Where applicable, shift transfer timing to earlier in the day to reduce posting-risk.

---

## Troubleshooting ATM Fee Discrepancies

Use this section to reconcile Rho-Bank’s ATM fees shown on your statement.

1. Domestic out-of-network ATM transactions
   - Our fee per transaction: $0.00.
   - If you see any domestic out-of-network ATM fee from us other than $0.00, capture the transaction details and request a review.

2. Foreign (international) ATM withdrawals
   - Our fee is 1% of the withdrawal amount, with a minimum of $2.00 per withdrawal.
   - Examples:
     - $400 withdrawal: 1% of $400 = $4.00; fee should be $4.00.
     - $150 withdrawal: 1% of $150 = $1.50, which is below the $2.00 minimum; fee should be $2.00.
   - If the fee you see seems off, confirm the USD amount used for the posted withdrawal and recalculate using 1% with the $2.00 floor.

---

## Common Root Causes and Fixes

- Balance just under waiver threshold
  - Cause: Routine sweeps or late postings left the Beige account slightly below $500,000.
  - Fix: Raise the account’s target buffer and adjust sweep timing so the balance is above $500,000 at measurement.

- Aggregation or auto-fund rules moved funds out unexpectedly
  - Cause: Liquidity rules executed earlier than expected or before the period closed.
  - Fix: Update rule timing or conditions; confirm posting order and dependencies.

- Pending transfers due to dual authorization
  - Cause: A required co-approval wasn’t completed in time.
  - Fix: Set up backup approvers and alerts to ensure time-sensitive movements complete before balance measurement.

- ATM fee mismatch
  - Cause: Misinterpreting which withdrawals are domestic vs. foreign, or not applying the minimum for foreign withdrawals.
  - Fix: Reconcile using $0.00 for domestic and 1% with the $2.00 floor for foreign transactions.

---

## What to Provide When Contacting Support

Prepare the following to expedite resolution:
- Statement period and date the fee posted
- Balance history for the period relative to $500,000 and $250,000
- Transfer logs (including API/ERP-initiated movements), rule configurations, and approval timestamps
- For ATM issues: transaction date, location (domestic or foreign), withdrawal amount in USD, and the fee posted relative to 1% and $2.00