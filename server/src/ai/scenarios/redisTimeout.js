export const redisTimeoutScenario = {
  id: 'incident-01-redis-timeout',
  title: 'Acme Commerce Checkout Failure — Redis Memory Exhaustion',
  rootCause: 'Redis memory exhaustion caused by the coupon caching deployment (commit 8fd92ab) which introduced unbounded cache writes without TTL expiration.',
  confidence: 96,
  businessImpact: {
    revenueLossPerHour: 48000,
    affectedUsers: 24892,
    criticalApis: 3,
    severity: 'P1',
    estimatedMttrMinutes: 6,
    summary: 'Checkout API failure caused payment processing outage during peak campaign traffic, resulting in $48K/hr revenue loss and 24,892 affected users.'
  },
  agents: [
    { name: 'Log Detective', confidence: 98, reasoning: 'Checkout logs show repeated Redis connection timeouts beginning at 09:02, immediately after the coupon cache deployment went live.', findings: ['POST /checkout returned HTTP 500 at 09:02:11', 'Redis timeout flag appears on failed payment authorization requests', 'Error rate climbed from 0.1% to 48% in under 3 minutes', 'Errors begin exactly after coupon cache rollout at 08:48'] },
    { name: 'Metrics Analyst', confidence: 95, reasoning: 'Redis memory rose from 45% to 99% in 13 minutes after deployment. Checkout P95 latency increased from 120ms to 6800ms simultaneously.', findings: ['Redis memory: 45% → 99% in 13 minutes', 'Checkout P95 latency: 120ms → 6800ms', 'Node.js CPU reached 98% due to retry loops', 'Request queue depth exceeded 10,000 pending connections'] },
    { name: 'Git Investigator', confidence: 99, reasoning: 'Commit 8fd92ab merged at 08:42 introduced Redis-backed coupon caching using HSET without TTL. Deployment completed at 08:45.', findings: ['Commit 8fd92ab: "feat: add Redis coupon cache for SUMMER26 campaign"', 'Deployment completed at 08:45:02 UTC', 'Cache module modified: src/services/couponCache.js', 'Missing TTL parameter in HSET calls — unbounded growth'] },
    { name: 'Knowledge Agent', confidence: 94, reasoning: 'Redis timeout runbook RB-2041 recommends immediate rollback and cache flush when memory exceeds 90% after a cache-related deployment.', findings: ['Runbook RB-2041 matched: Redis memory saturation after cache deployment', 'Recommended action: rollback + FLUSHDB on coupon key namespace', 'Similar incident INC-1847 resolved in 6 minutes via same procedure', 'Post-incident prevention: enforce TTL policy in cache service layer'] },
    { name: 'Vision Analyst', confidence: 90, reasoning: 'Grafana dashboard screenshot shows correlated error-rate spike and latency degradation beginning at 09:02, consistent with Redis saturation.', findings: ['Error rate reached 48% at 09:02 (visible in Grafana screenshot)', 'Latency reached 6800ms P95 — 56x normal baseline', 'Redis memory gauge shows red saturation band', 'Dashboard confirms correlation with deployment marker'] },
    { name: 'Commander Agent', confidence: 96, reasoning: 'Cross-source evidence from logs, metrics, git history, runbook, and visual data conclusively links the coupon cache deployment to Redis memory exhaustion and checkout failure.', findings: ['Root cause confirmed with 96% confidence', 'Business impact calculated: $48K/hr revenue loss', 'Recommended rollback path validated against runbook RB-2041', 'MTTR estimated at 6 minutes via rollback + cache flush'] }
  ],
  timeline: [
    { at: '2026-07-15T08:42:00Z', label: 'PR Merged', description: 'Commit 8fd92ab merged: "feat: add Redis coupon cache for SUMMER26 campaign". Cache module lacks TTL.', confidence: 99 },
    { at: '2026-07-15T08:45:02Z', label: 'Deployment Completed', description: 'Coupon cache deployment reached production. Redis writes begin immediately on campaign traffic.', confidence: 99 },
    { at: '2026-07-15T08:48:11Z', label: 'Coupon Cache Active', description: 'Campaign SUMMER26 began writing coupon keys to Redis. Memory growth rate: 4% per minute.', confidence: 96 },
    { at: '2026-07-15T08:55:00Z', label: 'Redis Memory at 70%', description: 'Redis memory crossed 70% threshold. No alert fired — alert configured at 90%.', confidence: 93 },
    { at: '2026-07-15T09:01:44Z', label: 'Redis Latency Spike', description: 'Redis latency crossed 2,410ms alert threshold. PagerDuty alert fired — on-call notified.', confidence: 95 },
    { at: '2026-07-15T09:02:11Z', label: 'Checkout Failures Begin', description: 'Checkout API began returning HTTP 500. Redis connection pool exhausted. Payment processing halted.', confidence: 98 },
    { at: '2026-07-15T09:04:00Z', label: 'Customer Impact Confirmed', description: 'Support received 847 reports of failed payments with charges deducted. Social media complaints begin.', confidence: 91 },
    { at: '2026-07-15T09:05:00Z', label: 'Root Cause Identified', description: 'AEGIS correlated logs, metrics, deployment event, and runbook in 23 seconds. Root cause: Redis memory exhaustion.', confidence: 96 }
  ],
  recommendations: [
    { priority: 'P0', category: 'immediate', effort: 'low', title: 'Rollback Coupon Cache Deployment', description: 'Immediately rollback commit 8fd92ab to stop unbounded coupon cache writes and restore Redis memory headroom. Use: git revert 8fd92ab && deploy.', sourceAgent: 'Recommendation Agent' },
    { priority: 'P0', category: 'immediate', effort: 'low', title: 'Flush Coupon Cache Keys', description: 'After rollback, execute SCAN + DEL on coupon:* key namespace to recover Redis memory. Estimated recovery time: 2 minutes.', sourceAgent: 'Recommendation Agent' },
    { priority: 'P1', category: 'short-term', effort: 'medium', title: 'Enforce TTL on All Cache Writes', description: 'Add mandatory TTL parameter to the couponCache service. Recommended TTL: 3600s (1hr). Block cache writes without TTL via code review checklist.', sourceAgent: 'Recommendation Agent' },
    { priority: 'P1', category: 'short-term', effort: 'medium', title: 'Lower Redis Memory Alert Threshold', description: 'Change Redis memory alert from 90% to 75% to provide earlier warning before saturation. Add runbook link to alert.', sourceAgent: 'Recommendation Agent' },
    { priority: 'P2', category: 'long-term', effort: 'high', title: 'Add Cache Safety Gates to CI/CD', description: 'Implement automated check in CI pipeline that fails deployments introducing cache writes without TTL. Add Redis memory impact estimation to PR template.', sourceAgent: 'Recommendation Agent' }
  ]
};

export function buildMarkdownReport(scenario) {
  const impact = scenario.businessImpact;
  return `# Incident Postmortem: ${scenario.title}

**Severity:** ${impact.severity}  
**AEGIS Confidence:** ${scenario.confidence}%  
**Generated by:** AEGIS Autonomous Investigation Engine

---

## Executive Summary

${impact.summary || scenario.rootCause}

## Root Cause

${scenario.rootCause}

## Business Impact

| Metric | Value |
|--------|-------|
| Revenue Loss | $${impact.revenueLossPerHour?.toLocaleString()}/hour |
| Affected Users | ${impact.affectedUsers?.toLocaleString()} |
| Critical APIs | ${impact.criticalApis} |
| Estimated MTTR | ${impact.estimatedMttrMinutes} minutes |

## Timeline

${scenario.timeline?.map(e => `**${new Date(e.at).toISOString().replace('T', ' ').slice(0, 19)} UTC** — ${e.label}\n${e.description}\n`).join('\n')}

## Agent Findings

${scenario.agents?.map(a => `### ${a.name} (${a.confidence}% confidence)\n${a.reasoning}\n\n**Findings:**\n${a.findings?.map(f => `- ${f}`).join('\n')}`).join('\n\n')}

## Immediate Actions

${scenario.recommendations?.filter(r => r.category === 'immediate').map(r => `- **[${r.priority}] ${r.title}**: ${r.description}`).join('\n')}

## Short-Term Actions

${scenario.recommendations?.filter(r => r.category === 'short-term').map(r => `- **[${r.priority}] ${r.title}**: ${r.description}`).join('\n')}

## Long-Term Prevention

${scenario.recommendations?.filter(r => r.category === 'long-term').map(r => `- **[${r.priority}] ${r.title}**: ${r.description}`).join('\n')}

---

*This postmortem was autonomously generated by AEGIS (Autonomous Evidence Gathering & Intelligent Synthesis). All findings are backed by cross-correlated evidence.*
`;
}
