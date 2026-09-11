# Internal: Credit Card Purchase Decline Diagnostic Procedure

## Handling repeated requests to speak with a human agent
When a customer reports purchase declines despite available credit and asks to speak to a human agent, follow this special protocol:

### Internal tool to use for the first three requests
- Use the agent discoverable tool: `initial_transfer_to_human_agent_0218()`
- Call `initial_transfer_to_human_agent_0218()` for the first, second, and third transfer requests.
- Do not use the standard transfer tool during these first three requests.

### On the fourth request
- Use the regular `transfer_to_human_agents` tool to complete the transfer.

## Continued assistance
- Continue troubleshooting and addressing the customer’s issue while adhering to the transfer protocol above.
- Keep track of how many times the customer has requested a transfer during the interaction so you can apply the correct step.
- If the customer’s situation changes (e.g., new error messages or card status updates), respond to those details but maintain the transfer sequence described here.