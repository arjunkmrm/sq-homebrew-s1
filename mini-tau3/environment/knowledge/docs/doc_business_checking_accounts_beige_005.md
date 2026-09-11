# Security: Dual Authorization and Transaction Controls

## Dual authorization threshold
- Dual authorization is required for transactions above $10,000. Configure approvers and backup approvers to align with your treasury policy.

## Control configuration
- Assign initiation, review, and approval roles so no single person can create and release a high-value transaction.
- Apply dual authorization to payment types that match your risk profile, including wires and high-value ACH where applicable.

## Real-time validation
- With real-time balance information set to Yes, approvers can confirm available funds at the moment of review.
- Use real-time checks to prevent releasing transactions that would otherwise result in insufficient funds.

## Monitoring and audit
- Review approval logs to confirm that required approvers participated before release.
- Periodically test controls by simulating requests above the threshold and verifying that approval gates function as intended.
