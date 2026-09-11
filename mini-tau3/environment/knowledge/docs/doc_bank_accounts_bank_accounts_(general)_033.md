# Internal: ATM Dispute Special Procedures

ATM-related disputes have unique requirements based on whether the ATM is Rho-Bank owned or a third-party ATM.

**Rho-Bank ATM Disputes:**

For transactions at Rho-Bank branded ATMs, we have access to internal records and can expedite investigation.

1. **Cash Discrepancy (machine dispensed wrong amount or no cash):**
   - View recent transactions on the corresponding checking accounts to pull ATM journal records for the transaction
   - Compare journal record to customer claim
   - If discrepancy confirmed, provisional credit is issued immediately (no waiting period)
   - If journal shows correct amount dispensed, inform customer the claim cannot be validated but they may still file a formal dispute

2. **Deposit Not Credited:**
   - Use get_atm_deposit_images_8473 to retrieve envelope/check images
   - Compare to expected deposit amount
   - Deposit disputes may take up to 45 days due to physical verification needs

3. **Card Retained by ATM:**
   - If Rho-Bank ATM, card can be retrieved from branch within 3 business days
   - Offer to either retrieve card OR close old card and order replacement
   - No dispute needed unless there are also unauthorized transactions

**Third-Party ATM Disputes:**

For transactions at non-Rho-Bank ATMs (Allpoint network, bank partners, or independent ATMs):

1. We must submit a chargeback request to the ATM owner/network
2. Investigation timeline extends to 90 days
3. Provisional credit is still required within 10 business days
4. Customer may be asked to sign an affidavit if disputed amount exceeds $200

**ATM Affidavit Requirement:**

For ATM cash discrepancy disputes exceeding $200, the customer must sign an Electronic Fund Transfer Error Resolution Affidavit. Inform the customer:
- An affidavit will be emailed to their registered email address
- They have 10 business days to sign and return it
- Failure to return the affidavit may result in denial of the claim
- Signing a false affidavit is a federal offense