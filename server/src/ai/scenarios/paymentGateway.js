export const paymentGatewayScenario = {
  id: 'incident-03-payment-gateway',
  title: 'NovaPay Platform — Stripe Webhook Processing Outage',
  rootCause: 'Stripe webhook endpoint began returning HTTP 500 due to a missing null check on the payment_intent object after Stripe deprecated the charge.succeeded event format in API version 2024-06-20, causing the webhook handler to throw an unhandled TypeError.',
  confidence: 97,
  businessImpact: {
    revenueLossPerHour: 220000,
    affectedUsers: 8921,
    criticalApis: 4,
    severity: 'P0',
    estimatedMttrMinutes: 8,
    summary: 'Payment confirmation webhooks failed for all transactions, leaving $220K/hr in revenue in limbo with customers charged but orders not fulfilled.'
  },
  agents: [
    { name: 'Log Detective', confidence: 98, reasoning: 'Webhook handler logs show TypeError: Cannot read property "amount" of undefined. This occurs when charge.succeeded is received instead of payment_intent.succeeded — the new Stripe format.', findings: ['TypeError: Cannot read property "amount" of undefined at webhookHandler.js:84', 'Stripe-Signature header present — webhooks are authentic but failing validation', 'Error affects 100% of payment confirmation events since 11:00 UTC', 'payment_intent object is undefined in charge.succeeded event type'] },
    { name: 'Metrics Analyst', confidence: 95, reasoning: 'Payment webhook success rate dropped from 99.8% to 0% at 11:00 UTC. Stripe dashboard shows 4,421 failed webhook deliveries in 2 hours.', findings: ['Webhook success rate: 99.8% → 0% at 11:00 UTC', '4,421 failed webhook deliveries in first 2 hours', 'Order fulfillment pipeline: completely stalled', 'Stripe is retrying webhooks — backlog growing at 2,210 events/hour'] },
    { name: 'Git Investigator', confidence: 92, reasoning: 'No application code changes in 72 hours. Stripe API version was auto-upgraded to 2024-06-20 at account level — Stripe changelog confirms charge.succeeded deprecation in this version.', findings: ['No application deploys in 72 hours — confirms external dependency change', 'Stripe API version changed to 2024-06-20 (auto-upgrade applied to account)', 'Stripe changelog: charge.succeeded deprecated in 2024-06-20 — replaced by payment_intent.succeeded', 'Webhook handler uses charge.succeeded format (legacy)'] },
    { name: 'Knowledge Agent', confidence: 96, reasoning: 'Stripe migration guide and internal runbook PAY-002 document the charge.succeeded → payment_intent.succeeded migration path.', findings: ['Stripe Migration Guide: https://stripe.com/docs/upgrades — charge.succeeded deprecated', 'Runbook PAY-002: Webhook event format change — update handler to use event.data.object.payment_intent', 'Fix requires 15-minute code change, zero downtime deployment', 'Backlog processing: use Stripe dashboard to replay failed webhooks after fix'] },
    { name: 'Vision Analyst', confidence: 89, reasoning: 'Stripe dashboard screenshot shows 4,421 failed webhook events with 500 status. Error rate chart shows cliff-edge drop at 11:00 UTC.', findings: ['Stripe dashboard: 4,421 failed deliveries with HTTP 500 response', 'All failures show identical error pattern — systematic not intermittent', 'Webhook error chart shows cliff-edge onset at 11:00 UTC (API version upgrade time)'] },
    { name: 'Commander Agent', confidence: 97, reasoning: 'Stripe API version auto-upgrade at 11:00 UTC changed webhook event format. Application code was not updated for this breaking change. Fix is a 15-minute code patch.', findings: ['Root cause: Stripe API 2024-06-20 breaking change not handled', 'No application deploy in 72h confirms external trigger', 'Fix: update webhook handler to use payment_intent.succeeded format', 'Backlog: 4,421 events ready to replay via Stripe dashboard'] }
  ],
  timeline: [
    { at: '2026-07-15T11:00:00Z', label: 'Stripe API Auto-Upgrade', description: 'Stripe account auto-upgraded to API version 2024-06-20. charge.succeeded event format deprecated.', confidence: 99 },
    { at: '2026-07-15T11:00:05Z', label: 'Webhook Failures Begin', description: 'First payment_intent.succeeded webhook received. Handler expects charge.succeeded format. TypeError thrown.', confidence: 98 },
    { at: '2026-07-15T11:00:15Z', label: 'Order Fulfillment Stalls', description: 'Order processing pipeline receives no confirmation events. Orders stuck in "pending payment" state.', confidence: 96 },
    { at: '2026-07-15T11:22:00Z', label: 'Customer Support Alert', description: 'Support receives 847 tickets: "charged but order not confirmed". CTO escalated.', confidence: 94 },
    { at: '2026-07-15T11:25:00Z', label: 'AEGIS Investigation Launched', description: 'AEGIS identifies Stripe API version change as root cause in 28 seconds.', confidence: 97 },
    { at: '2026-07-15T11:33:00Z', label: 'Webhook Handler Patched', description: 'payment_intent.succeeded handler deployed. Webhook processing resumed. Backlog replay initiated.', confidence: 99 }
  ],
  recommendations: [
    { priority: 'P0', category: 'immediate', effort: 'medium', title: 'Patch Webhook Handler for payment_intent.succeeded', description: 'Update webhookHandler.js to handle payment_intent.succeeded event type. Change event.data.object to use payment_intent structure.', sourceAgent: 'Recommendation Agent' },
    { priority: 'P0', category: 'immediate', effort: 'low', title: 'Replay Failed Webhooks via Stripe Dashboard', description: 'After code fix, use Stripe Dashboard → Webhooks → Replay failed events to process the 4,421 queued events.', sourceAgent: 'Recommendation Agent' },
    { priority: 'P1', category: 'short-term', effort: 'medium', title: 'Subscribe to Stripe API Changelog Alerts', description: 'Enable Stripe webhook changelog notifications in account settings to receive advance notice of breaking changes.', sourceAgent: 'Recommendation Agent' },
    { priority: 'P1', category: 'short-term', effort: 'medium', title: 'Implement Webhook Event Validation Tests', description: 'Add integration tests for each webhook event type against Stripe test fixtures. Include tests in CI pipeline.', sourceAgent: 'Recommendation Agent' },
    { priority: 'P2', category: 'long-term', effort: 'high', title: 'Add Webhook Processing Dead Letter Queue', description: 'Implement dead-letter queue for failed webhooks to enable retry without relying on Stripe\'s 72-hour retry window.', sourceAgent: 'Recommendation Agent' }
  ]
};
