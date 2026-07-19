# Redis Timeout Runbook

If checkout failures coincide with Redis timeout:

1. Check recent deployments touching cache behavior.
2. Check Redis memory and eviction policy.
3. Roll back the latest cache-related deployment if memory is above 90%.
4. Flush campaign coupon cache keys.
5. Restart Redis only after rollback is complete.
6. Add TTL to cache keys and alerting for memory above 80%.
