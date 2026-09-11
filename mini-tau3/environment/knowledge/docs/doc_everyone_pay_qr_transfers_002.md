# How QR transfers work

## Transfer flow
- A QR code is generated to represent a payment request and remains valid for 17.
- The payer scans the QR using the in-app scanner.
- The app validates the request details and prepares the payment.
- If Yes applies, you will be prompted to review and approve before funds move.
- Once approved (or automatically processed if no approval is required), the transfer is initiated.

### QR code lifecycle
- Created: The code is generated and starts its validity window of 17.
- Scanned: The payer’s app reads the code and loads the payment details.
- Confirmed: If Yes is in effect, the payer approves on the confirmation screen.
- Completed: Funds move after the app submits the payment.

### When a transfer won’t proceed
- The QR is older than 17 and must be regenerated.
- You close or dismiss the flow during the review stage when Yes applies.
- Connectivity issues interrupt the process before submission.

### Practical tips
- Scan promptly to stay within the 17 window.
- If prompted, use the Yes review moment to verify details before sending.