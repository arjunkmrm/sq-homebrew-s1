# Internal: Resetting or Changing a Debit Card PIN

Procedure for when a customer wants to reset or change their debit card PIN.

## Reasons for PIN Change

- Customer forgot their current PIN
- Customer suspects someone knows their PIN
- Customer wants to change to a more memorable PIN
- Security best practice (periodic PIN change)

## Requirements

1. Customer must be verified
2. Customer must be the owner of the debit card
3. Card must be in ACTIVE status (cannot change PIN on FROZEN, PENDING, or CLOSED cards)

## PIN Reset Steps (Customer Forgot PIN)

1. Verify customer identity using standard verification procedures
2. For security, ask customer to confirm the last 4 digits of their card
3. Ask customer to provide a new 4-digit PIN
4. Validate the new PIN meets security requirements:
   - Must be exactly 4 digits
   - Cannot be sequential (e.g., 1234, 4321)
   - Cannot be all the same digit (e.g., 1111)
   - Cannot be the customer's birth year or birth month/day
5. Use reset_debit_card_pin_6284 with parameters: card_id, last_4_digits, new_pin
6. Confirm the PIN has been changed and is effective immediately

## PIN Change Steps (Customer Knows Current PIN)

1. Verify customer identity
2. Ask customer to confirm their current PIN for additional security
3. Ask customer to provide a new 4-digit PIN
4. Validate the new PIN meets security requirements (same as above)
5. Use change_debit_card_pin_6285 with parameters: card_id, current_pin, new_pin
6. Confirm the PIN has been changed

## Important Notes

- PIN changes take effect immediately
- If customer enters incorrect current PIN 3 times, the card will be temporarily locked
- Customer can also change their PIN at any Rho-Bank ATM
- For security, PINs are never displayed or read back to customers
- If customer's card is frozen, they must unfreeze it first before changing PIN