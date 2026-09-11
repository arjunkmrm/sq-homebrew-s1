# FAQ: Troubleshooting

## Quick checks to resolve common issues
- Ensure the customer is using the latest version of the mobile app or a supported web browser.
- Confirm the account is active and the customer is signed in with the correct profile.
- Verify that connectivity is stable and ask the customer to try a different network if possible.
- If the user experiences any issues with the website, they should try refreshing their cache using the `refresh_cache` tool.

## User-callable tool: Refresh cached site data
Provide the following tool directly to the user and instruct them to run it. Do not execute it on their behalf.
- Tool signature: `refresh_cache()`
- What to tell the user: “Please run the `refresh_cache()` tool to clear your cached site data and reload the latest version of the website.”
- Why this replaces manual steps: Instead of walking through browser settings, provide the exact tool name (and parameters, if any) so the user can perform the refresh immediately.

## Scenario-based guidance
- Balance not updating after a deposit: Ask the user to sign out and back in after running `refresh_cache()`. Then recheck the account activity screen.
- Transaction missing or pending: Review pending activity; some card authorizations and merchant adjustments take time to finalize.
- Transfers appear stuck: Confirm destination account details and any external bank maintenance notices; recheck status after a refreshed session.
- Sign-in problems: Verify correct username, recent password changes, and that the customer is not using a VPN that could trigger additional security checks.

## When to escalate
- The issue persists across devices and networks after the user runs `refresh_cache()` and signs back in.
- The customer reports specific error codes or repeated failures initiating payments, deposits, or transfers.
- Security concerns (e.g., suspected unauthorized access) or account access lockouts.