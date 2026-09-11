# API Rate Limits and Technical Specifications

## Monthly call allocation
- Your integration is allocated $100,000 API calls per month. Track consumption and design polling strategies that respect this limit.

## Real-time behavior
- Balance updates are Yes. Favor event-driven or on-change sync patterns to reduce unnecessary calls while maintaining current data.

## Design recommendations
- Cache reference data and only request deltas for transactions and balances.
- Implement exponential backoff and idempotency for retried calls to prevent duplication and wasted consumption.
- Monitor error rates and throttle proactively if you approach your monthly call allocation.

## Observability
- Instrument your integration with counters for successful calls, error responses, and retries so you can tune usage before limits are reached.
