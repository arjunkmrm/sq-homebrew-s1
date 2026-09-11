# Internal: Recurring Payment Disputes vs. Stop Future Payments

When a customer has issues with recurring debit card charges (subscriptions, memberships, automatic payments), there are TWO different processes depending on what they need:

**DISPUTE (Past Charges):**
Use the standard debit dispute process for charges that have ALREADY occurred. This applies when:
- Customer cancelled with merchant but was charged after cancellation
- Customer never authorized the recurring charge
- Amount charged differs from agreed amount

For recurring charge disputes, the dispute_category should be 'recurring_charge_after_cancellation'.

**BLOCK RECURRING PAYMENTS (Future Charges):**
To PREVENT future recurring charges on a debit card, use the recurring block feature. This blocks ALL recurring/subscription payments on the card - not just a specific merchant.

Blocking Process:
1. Verify customer identity
2. Explain that this will block ALL recurring payments on the card, not just one merchant
3. Use set_debit_card_recurring_block_7382 with:
   - card_id: The debit card ID
   - block_recurring: true to block, false to unblock
4. Inform customer:
   - Block takes effect within 24 hours
   - One-time purchases are NOT affected - only recurring/subscription charges
   - This does NOT cancel their subscriptions with merchants - they must still contact merchants directly
   - Block remains active until customer requests it to be removed

**When Customer Needs BOTH:**

If customer was charged after cancellation AND wants to prevent future charges:
1. First file the dispute for past charges
2. Then set up the recurring block for future protection
3. Still advise customer to confirm cancellation directly with merchant in writing

**Important Notes:**
- The recurring block affects ALL recurring payments, not just specific merchants
- If customer only wants to block one merchant, advise them to cancel directly with that merchant
- Customer can unblock recurring payments at any time by calling back