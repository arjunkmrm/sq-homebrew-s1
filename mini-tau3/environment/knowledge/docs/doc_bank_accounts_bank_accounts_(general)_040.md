# Internal: Requesting Temporary Debit Card Limit Increase

Procedure for when a customer requests a temporary increase to their debit card's daily ATM withdrawal or purchase limit.

Eligibility Requirements:
Before granting a temporary limit increase, verify ALL of the following:
1) **Account Status**: The linked checking account must be OPEN (in good standing)
2) **Account Age**: The account must be at least 60 days old
3) **Overdraft History**: No overdraft fees in the last 30 days
4) **Card Status**: The debit card must be ACTIVE

Limit Increase Rules:
- **Maximum Increase**: New limit cannot exceed 150% of current limit (50% boost maximum)
- **Duration**: Temporary increases last 24 hours, then automatically revert
- **Frequency**: Only one temporary increase per 24-hour period per card

Tool: request_temporary_debit_card_limit_increase_8374
Parameters:
- card_id: The debit card ID
- limit_type: 'atm' or 'purchase'
- new_limit: The requested new temporary limit

Note: Third-party ATMs may have their own limits that Rho-Bank cannot override.