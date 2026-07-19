export const redisTimeoutScenario = {
  rootCause: 'Redis memory exhaustion caused by the coupon caching deployment without TTL.',
  confidence: 96,
  businessImpact: {
    revenueLossPerHour: 48000,
    affectedUsers: 24892,
    criticalApis: 3,
    severity: 'P1',
    estimatedMttrMinutes: 6
  },
  agents: [
    {
      name: 'Log Detective',
      confidence: 98,
      reasoning: 'Checkout logs show repeated Redis connection timeouts beginning at 09:02 after the deployment.',
      findings: ['POST /checkout returned HTTP 500', 'Redis timeout flag appears on failed payment authorization', 'Errors begin after coupon cache rollout']
    },
    {
      name: 'Metrics Analyst',
      confidence: 95,
      reasoning: 'Redis memory rose from 45% to 99%, while checkout latency increased from 120ms to 6800ms.',
      findings: ['Redis memory saturation', 'P95 latency spike', 'Node CPU reached 98%']
    },
    {
      name: 'Git Investigator',
      confidence: 99,
      reasoning: 'Commit 8fd92ab introduced Redis-backed coupon caching without TTL.',
      findings: ['Deployment completed at 08:45', 'Coupon cache enabled at 08:48', 'Cache-related files changed']
    },
    {
      name: 'Knowledge Agent',
      confidence: 94,
      reasoning: 'The Redis timeout runbook recommends rollback when memory exceeds 90% after a cache deployment.',
      findings: ['Runbook matched current symptoms', 'Rollback and cache flush recommended']
    },
    {
      name: 'Vision Analyst',
      confidence: 90,
      reasoning: 'Dashboard evidence indicates a correlated error-rate and latency spike around checkout.',
      findings: ['Error rate reached 48%', 'Latency reached 6800ms']
    },
    {
      name: 'Commander Agent',
      confidence: 96,
      reasoning: 'Cross-source evidence links deployment, cache behavior, Redis memory exhaustion, and checkout failures.',
      findings: ['Root cause confirmed', 'Business impact calculated', 'Recommended rollback path ready']
    }
  ],
  timeline: [
    { at: '2026-07-15T08:45:02Z', label: 'Deployment completed', description: 'Commit 8fd92ab deployed checkout coupon caching.', confidence: 99 },
    { at: '2026-07-15T08:48:11Z', label: 'Coupon cache enabled', description: 'Campaign SUMMER26 began writing coupon keys to Redis.', confidence: 96 },
    { at: '2026-07-15T09:01:44Z', label: 'Redis latency spike', description: 'Redis latency crossed alert threshold at 2410ms.', confidence: 95 },
    { at: '2026-07-15T09:02:11Z', label: 'Checkout failures begin', description: 'Checkout API returned HTTP 500 due to Redis timeout.', confidence: 98 },
    { at: '2026-07-15T09:04:00Z', label: 'Customer impact confirmed', description: 'Support received reports of deducted payments and failed orders.', confidence: 91 },
    { at: '2026-07-15T09:05:00Z', label: 'Root cause identified', description: 'AEGIS correlated logs, metrics, deployment, and runbook evidence.', confidence: 96 }
  ],
  recommendations: [
    { priority: 'P0', category: 'immediate', title: 'Rollback cache deployment', description: 'Rollback commit 8fd92ab to stop unbounded coupon cache writes.' },
    { priority: 'P0', category: 'immediate', title: 'Flush coupon cache keys', description: 'Remove campaign coupon keys after rollback to recover Redis memory.' },
    { priority: 'P1', category: 'short-term', title: 'Add TTL to coupon cache', description: 'Set expiration on coupon cache writes to prevent memory exhaustion.' },
    { priority: 'P2', category: 'long-term', title: 'Add Redis memory alerts', description: 'Alert at 80% memory and block deploys that add cache paths without TTL.' }
  ]
};

export function buildMarkdownReport(scenario) {
  return `# Incident Postmortem: Checkout Failure

## Summary
${scenario.rootCause}

## Confidence
${scenario.confidence}%

## Business Impact
- Revenue loss: $${scenario.businessImpact.revenueLossPerHour.toLocaleString()}/hour
- Affected users: ${scenario.businessImpact.affectedUsers.toLocaleString()}
- Severity: ${scenario.businessImpact.severity}
- Estimated MTTR: ${scenario.businessImpact.estimatedMttrMinutes} minutes

## Timeline
${scenario.timeline.map((event) => `- ${event.at}: ${event.label} - ${event.description}`).join('\n')}

## Immediate Actions
${scenario.recommendations.filter((item) => item.category === 'immediate').map((item) => `- ${item.title}: ${item.description}`).join('\n')}

## Preventive Actions
${scenario.recommendations.filter((item) => item.category !== 'immediate').map((item) => `- ${item.title}: ${item.description}`).join('\n')}
`;
}
