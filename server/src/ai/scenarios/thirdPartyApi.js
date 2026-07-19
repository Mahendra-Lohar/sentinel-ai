export const thirdPartyApiScenario = {
  id: 'incident-09-third-party-api',
  title: 'NotifyHub — SendGrid Transactional Email Outage',
  rootCause: 'SendGrid experienced a regional outage in US-East affecting transactional email delivery. NotifyHub had no circuit breaker or fallback email provider, causing the notification service to queue indefinitely and exhaust its retry budget. 94,000 transactional emails were undelivered during the 2-hour outage window.',
  confidence: 89,
  businessImpact: {
    revenueLossPerHour: 18000,
    affectedUsers: 94000,
    criticalApis: 2,
    severity: 'P2',
    estimatedMttrMinutes: 45,
    summary: 'SendGrid regional outage caused 94,000 transactional emails (password resets, order confirmations, 2FA codes) to fail delivery, degrading user trust and blocking account access.'
  },
  agents: [
    { name: 'Log Detective', confidence: 91, reasoning: 'SendGrid API returning 503 Service Unavailable since 13:00 UTC. Notification service retry queue growing at 2,400 messages/hour. Retry budget exhausted at 3 attempts/message.', findings: ['SendGrid API: 503 Service Unavailable since 13:00:02 UTC', 'Retry attempts: 94,000 messages × 3 retries = 282,000 failed SendGrid API calls', 'Critical: password reset emails failing — users locked out of accounts', 'Order confirmation emails queued: 31,400 — e-commerce SLA breach'] },
    { name: 'Metrics Analyst', confidence: 87, reasoning: 'Email delivery success rate dropped from 99.7% to 0% at 13:00 UTC. Notification queue depth growing continuously. No circuit breaker activated — all requests still hitting SendGrid.', findings: ['Email delivery rate: 99.7% → 0% at 13:00 UTC', 'Notification queue depth: 0 → 94,000 messages over 2 hours', 'SendGrid API response time: 180ms → 30,000ms (timeout)', 'Circuit breaker: NOT implemented — 100% of requests still sent to SendGrid'] },
    { name: 'Git Investigator', confidence: 82, reasoning: 'No deployments in 5 days. SendGrid status page (status.sendgrid.com) shows "Investigating - Email Delivery Issues in US-East" since 12:58 UTC.', findings: ['No application deployments in 5 days — external failure confirmed', 'SendGrid status page: "Investigating email delivery issues" since 12:58 UTC', 'No fallback provider configured in notification service', 'Mailgun and AWS SES available as fallback candidates — not integrated'] },
    { name: 'Knowledge Agent', confidence: 93, reasoning: 'Runbook NOTIFY-001 recommends failover to backup email provider. AWS SES credentials are available in secrets manager. Failover takes ~20 minutes to configure and test.', findings: ['Runbook NOTIFY-001: Email provider failover procedure', 'AWS SES available: credentials in secrets/aws-ses-key', 'Failover: update EMAIL_PROVIDER=ses + EMAIL_SES_REGION=us-east-1 + restart', 'Queued messages can be replayed after failover — no data loss'] },
    { name: 'Vision Analyst', confidence: 85, reasoning: 'SendGrid status page screenshot confirms US-East outage. Internal notification queue depth chart shows linear growth with no delivery events.', findings: ['SendGrid status page: "Email Delivery Issues" status, US-East region', 'Internal queue depth: linear growth since 13:00 UTC', 'Zero delivery events in past 2 hours — no partial recovery'] },
    { name: 'Commander Agent', confidence: 89, reasoning: 'External SendGrid outage with no failover configured. Fix: failover to AWS SES and replay queued messages. Long-term: implement circuit breaker + multi-provider routing.', findings: ['Root cause: third-party provider outage + no circuit breaker', 'No customer data loss — emails queued and replayable', 'Immediate fix: failover to AWS SES via environment variable change', 'Long-term: circuit breaker + automatic failover on provider errors'] }
  ],
  timeline: [
    { at: '2026-07-15T12:58:00Z', label: 'SendGrid US-East Outage Begins', description: 'SendGrid experiences infrastructure issues in US-East. Email delivery begins failing.', confidence: 97 },
    { at: '2026-07-15T13:00:02Z', label: 'First Email Delivery Failure', description: 'NotifyHub receives first 503 from SendGrid. Retry logic activates — no circuit breaker.', confidence: 99 },
    { at: '2026-07-15T13:15:00Z', label: 'Password Reset Emails Failing', description: 'Users begin reporting inability to reset passwords. 2FA emails also failing.', confidence: 94 },
    { at: '2026-07-15T14:00:00Z', label: 'Queue at 47,000 Messages', description: 'Notification queue depth reaches 47,000. E-commerce SLA breach for order confirmations.', confidence: 92 },
    { at: '2026-07-15T14:30:00Z', label: 'AEGIS Identifies Failover Path', description: 'AEGIS identifies AWS SES as available failover provider in 15 seconds.', confidence: 89 },
    { at: '2026-07-15T14:45:00Z', label: 'AWS SES Failover Active', description: 'EMAIL_PROVIDER=ses deployed. Queue replay initiated. Email delivery resumed at 99.4% success rate.', confidence: 99 }
  ],
  recommendations: [
    { priority: 'P0', category: 'immediate', effort: 'medium', title: 'Failover to AWS SES', description: 'Update EMAIL_PROVIDER=ses in production env. AWS SES credentials available in secrets/aws-ses-key. Restart notification-service. Estimated: 20 min including testing.', sourceAgent: 'Recommendation Agent' },
    { priority: 'P0', category: 'immediate', effort: 'low', title: 'Replay Queued Email Messages', description: 'After SES failover, trigger queue replay: POST /admin/notifications/replay-queue. Prioritize password reset and 2FA emails.', sourceAgent: 'Recommendation Agent' },
    { priority: 'P1', category: 'short-term', effort: 'medium', title: 'Implement Circuit Breaker for Email Provider', description: 'Add circuit breaker (half-open after 30s, open on 5 consecutive errors) to notification service. Auto-failover to secondary provider when circuit opens.', sourceAgent: 'Recommendation Agent' },
    { priority: 'P2', category: 'long-term', effort: 'high', title: 'Multi-Provider Email Routing', description: 'Implement provider abstraction layer that routes to SendGrid (primary), SES (secondary), or Mailgun (tertiary) based on health checks and delivery rates.', sourceAgent: 'Recommendation Agent' }
  ]
};
