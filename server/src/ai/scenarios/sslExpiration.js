export const sslExpirationScenario = {
  id: 'incident-05-ssl-expiration',
  title: 'MedCore Health — SSL Certificate Silent Expiration',
  rootCause: 'The production SSL certificate for api.medcore.health expired silently at 03:00 UTC. The certificate renewal automation (cert-manager) failed 30 days earlier due to a DNS-01 challenge misconfiguration caused by a Route53 IAM permission change. No alert was configured for cert-manager failures.',
  confidence: 95,
  businessImpact: {
    revenueLossPerHour: 31000,
    affectedUsers: 18400,
    criticalApis: 5,
    severity: 'P1',
    estimatedMttrMinutes: 35,
    summary: 'SSL certificate expiration caused all HTTPS connections to fail, blocking 18,400 healthcare users from accessing patient records and prescription services.'
  },
  agents: [
    { name: 'Log Detective', confidence: 96, reasoning: 'Nginx logs show SSL_CTX_use_certificate_file failed with certificate expired error. cert-manager logs from 30 days ago show DNS-01 challenge failing with AccessDenied on Route53.', findings: ['nginx: SSL_CTX_use_certificate_file: certificate expired (notAfter: Jul 15 03:00:00 2026 GMT)', 'cert-manager (30 days ago): Route53 DNS-01 challenge failed: AccessDenied: route53:ChangeResourceRecordSets', 'cert-manager CertificateRequest "api-medcore-health" in state: Failed — no retry after IAM error', 'No alert on cert-manager failure — silent for 30 days'] },
    { name: 'Metrics Analyst', confidence: 93, reasoning: 'HTTPS connection success rate dropped from 100% to 0% at 03:00 UTC. All clients receiving TLS handshake failure. HTTP (port 80) traffic showing redirect loops.', findings: ['HTTPS success rate: 100% → 0% at 03:00 UTC', 'TLS handshake failures: 18,400 clients affected', 'Certificate validity check: EXPIRED (expired 03:00:00 UTC July 15)', 'cert-manager renewal attempts: 0 in last 30 days (stuck in Failed state)'] },
    { name: 'Git Investigator', confidence: 88, reasoning: 'IAM policy change 31 days ago (commit c7e9f3a) restricted cert-manager service account permissions, removing route53:ChangeResourceRecordSets from the policy.', findings: ['Commit c7e9f3a (31 days ago): "security: tighten IAM permissions for k8s service accounts"', 'cert-manager IAM policy: route53:ChangeResourceRecordSets removed', 'Policy change failed cert-manager DNS-01 validation — CertificateRequest stuck in Failed', 'No alert or monitoring on CertificateRequest status in Kubernetes'] },
    { name: 'Knowledge Agent', confidence: 94, reasoning: 'SSL runbook SSL-001 provides emergency certificate renewal procedure using manual certbot. Estimated 35 minutes including DNS propagation.', findings: ['Runbook SSL-001: Emergency SSL renewal via certbot manual mode', 'Fix: certbot certonly --manual --preferred-challenges dns -d api.medcore.health', 'Then: kubectl create secret tls api-cert --cert=fullchain.pem --key=privkey.pem', 'Long-term: restore cert-manager IAM permissions and add CertificateRequest monitoring'] },
    { name: 'Vision Analyst', confidence: 90, reasoning: 'Browser screenshot shows NET::ERR_CERT_DATE_INVALID on api.medcore.health. Kubernetes dashboard screenshot shows CertificateRequest in Failed state.', findings: ['Browser: NET::ERR_CERT_DATE_INVALID error on api.medcore.health', 'Certificate details: expired July 15 2026 03:00 UTC', 'Kubernetes dashboard: CertificateRequest "api-medcore-health" Failed (30 days)', 'cert-manager logs: last renewal attempt July 15 2026 — 30 days ago'] },
    { name: 'Commander Agent', confidence: 95, reasoning: 'IAM permission change 31 days ago silently broke cert-manager. Certificate expired this morning without any alert. Emergency manual renewal required.', findings: ['Root cause: IAM permission removal broke cert-manager 31 days ago', 'Failure was silent for 30 days — no CertificateRequest monitoring', 'Emergency fix: manual certbot renewal + kubectl secret update', 'Prevention: monitor CertificateRequest status + alert 30 days before expiry'] }
  ],
  timeline: [
    { at: '2026-06-14T14:30:00Z', label: 'IAM Policy Tightened', description: 'Security team removed route53:ChangeResourceRecordSets from cert-manager IAM policy as part of permissions audit.', confidence: 99 },
    { at: '2026-06-14T15:00:00Z', label: 'cert-manager Renewal Failed', description: 'cert-manager attempted DNS-01 challenge. Route53 API returned AccessDenied. CertificateRequest stuck in Failed state — no alert fired.', confidence: 97 },
    { at: '2026-07-15T03:00:00Z', label: 'SSL Certificate Expired', description: 'Production certificate for api.medcore.health expired. All HTTPS connections begin failing globally.', confidence: 99 },
    { at: '2026-07-15T04:15:00Z', label: 'On-Call Alerted', description: 'Users began reporting login failures. On-call engineer received PagerDuty alert from synthetic monitor.', confidence: 95 },
    { at: '2026-07-15T04:20:00Z', label: 'AEGIS Investigation Launched', description: 'AEGIS identified expired cert + cert-manager failure chain in 31 seconds.', confidence: 95 },
    { at: '2026-07-15T04:55:00Z', label: 'Certificate Renewed', description: 'Emergency certbot renewal completed. New certificate deployed via kubectl. Services restored.', confidence: 99 }
  ],
  recommendations: [
    { priority: 'P0', category: 'immediate', effort: 'medium', title: 'Emergency Manual Certificate Renewal', description: 'Run: certbot certonly --manual --preferred-challenges dns -d api.medcore.health. Update Kubernetes secret with new cert. Total: ~35 min.', sourceAgent: 'Recommendation Agent' },
    { priority: 'P1', category: 'short-term', effort: 'low', title: 'Restore cert-manager IAM Permissions', description: 'Add route53:ChangeResourceRecordSets back to cert-manager IAM policy. Verify cert-manager can complete DNS-01 challenges.', sourceAgent: 'Recommendation Agent' },
    { priority: 'P1', category: 'short-term', effort: 'medium', title: 'Add Certificate Expiry Monitoring', description: 'Configure alerts for certificates expiring within 30 days. Monitor Kubernetes CertificateRequest status — alert on Failed state immediately.', sourceAgent: 'Recommendation Agent' },
    { priority: 'P2', category: 'long-term', effort: 'high', title: 'Implement Certificate Lifecycle Testing', description: 'Add monthly cert-manager end-to-end test in staging that validates full renewal cycle. Test IAM permissions as part of security audit process.', sourceAgent: 'Recommendation Agent' }
  ]
};
