export const dnsFailureScenario = {
  id: 'incident-04-dns-failure',
  title: 'CloudStream — DNS Resolution Failure (Route53 Misconfiguration)',
  rootCause: 'An automated Route53 Terraform plan applied incorrect NS records to the production hosted zone, replacing AWS-managed nameservers with development zone nameservers. This caused all production DNS resolution to fail globally within 5 minutes of DNS TTL expiry.',
  confidence: 93,
  businessImpact: {
    revenueLossPerHour: 78000,
    affectedUsers: 142000,
    criticalApis: 12,
    severity: 'P1',
    estimatedMttrMinutes: 22,
    summary: 'All production services became unreachable globally as DNS resolution failed. 142,000 users unable to access the platform for 22 minutes.'
  },
  agents: [
    { name: 'Log Detective', confidence: 91, reasoning: 'Load balancer access logs show zero requests received after 16:45 UTC. Route53 health checks began failing at 16:43 — DNS resolution returning NXDOMAIN for api.cloudstream.io.', findings: ['Zero requests to load balancer after 16:45 UTC — traffic blackout', 'Route53 health checks: NXDOMAIN for api.cloudstream.io, app.cloudstream.io', 'CDN origin checks: DNS resolution failure for all cloudstream.io subdomains', 'External DNS resolvers returning NXDOMAIN — confirms NS record corruption'] },
    { name: 'Metrics Analyst', confidence: 90, reasoning: 'Traffic dropped to zero across all regions simultaneously at 16:45 UTC. No server-side errors — the requests simply never arrived. Classic DNS failure signature.', findings: ['Inbound traffic: 8,400 req/min → 0 simultaneously across all regions', 'Server CPU/memory: idle (requests not arriving — not server-side failure)', 'CDN cache hit rate: dropped to 0 (origin DNS resolution failing)', 'Route53 resolver query volume: 0 (NS records pointing to wrong servers)'] },
    { name: 'Git Investigator', confidence: 97, reasoning: 'Terraform apply run at 16:40 UTC via CI pipeline. terraform plan shows Route53 NS record modification — production hosted zone ns records overwritten with staging zone values.', findings: ['Terraform apply at 16:40:22 UTC via github-actions/terraform.yml', 'terraform plan diff: aws_route53_record.cloudstream_ns CHANGED', 'NS records replaced: AWS production nameservers → staging nameservers', 'Root cause: terraform variable HOSTED_ZONE_ID set to staging ID in production pipeline'] },
    { name: 'Knowledge Agent', confidence: 89, reasoning: 'DNS-RUNBOOK-003 covers NS record restoration procedure. DNS TTL was 300s — full propagation took 5 minutes. Restoration requires NS record fix + 5-minute propagation wait.', findings: ['Runbook DNS-RUNBOOK-003: NS record restoration procedure', 'Fix: restore original NS records via Route53 console (not Terraform)', 'Propagation time: 5 minutes (TTL=300s)', 'Prevention: separate Terraform state files for DNS vs application infrastructure'] },
    { name: 'Vision Analyst', confidence: 86, reasoning: 'Monitoring screenshot shows traffic flatline across all regions at 16:45. Route53 health check dashboard shows all endpoints in UNHEALTHY state.', findings: ['Traffic dashboard: complete flatline across US-East, EU-West, AP-Southeast', 'Route53 health check dashboard: 14/14 endpoints UNHEALTHY', 'DNS query graph: zero queries resolved after 16:45 (NS pointing to wrong servers)'] },
    { name: 'Commander Agent', confidence: 93, reasoning: 'Terraform CI pipeline applied NS record changes that corrupted the production DNS zone. Traffic never reached servers. Fix is NS record restoration — estimated 22 minutes including propagation.', findings: ['Root cause: Terraform applied staging NS records to production Route53 zone', 'Traffic blackout confirmed — 0 requests reaching any server', 'Fix path: restore NS records via Route53 console + wait 5-min TTL propagation', 'Prevention: Terraform state isolation + DNS record change approval gates'] }
  ],
  timeline: [
    { at: '2026-07-15T16:40:22Z', label: 'Terraform Apply Triggered', description: 'CI pipeline applied Terraform plan to production. Route53 NS records changed to staging nameservers.', confidence: 99 },
    { at: '2026-07-15T16:40:30Z', label: 'NS Records Corrupted', description: 'Production hosted zone NS records now point to staging nameservers. DNS propagation begins.', confidence: 97 },
    { at: '2026-07-15T16:43:00Z', label: 'Route53 Health Checks Fail', description: 'AWS health checks detect DNS resolution failure for api.cloudstream.io. Alerts triggered.', confidence: 95 },
    { at: '2026-07-15T16:45:00Z', label: 'Global DNS Failure', description: 'DNS TTL (300s) expired globally. All resolvers returning NXDOMAIN. Complete traffic blackout.', confidence: 98 },
    { at: '2026-07-15T16:48:00Z', label: 'AEGIS Investigation Launched', description: 'AEGIS identifies Terraform NS record change as root cause in 42 seconds.', confidence: 93 },
    { at: '2026-07-15T17:07:00Z', label: 'NS Records Restored', description: 'Original NS records restored via Route53 console. DNS propagation complete after 5 minutes.', confidence: 99 }
  ],
  recommendations: [
    { priority: 'P0', category: 'immediate', effort: 'low', title: 'Restore Original NS Records via Route53 Console', description: 'Log into Route53 console and manually restore original AWS nameservers for cloudstream.io hosted zone. Do NOT use Terraform for this fix.', sourceAgent: 'Recommendation Agent' },
    { priority: 'P1', category: 'short-term', effort: 'medium', title: 'Separate DNS Terraform State from Application State', description: 'Move Route53 zone management to a separate, access-controlled Terraform workspace. Require manual approval for any NS record changes.', sourceAgent: 'Recommendation Agent' },
    { priority: 'P1', category: 'short-term', effort: 'medium', title: 'Add NS Record Change Protection', description: 'Add Terraform prevent_destroy lifecycle and plan approval gate specifically for Route53 NS records. Alert on any NS record modification in CI plan output.', sourceAgent: 'Recommendation Agent' },
    { priority: 'P2', category: 'long-term', effort: 'high', title: 'Implement Multi-Provider DNS Redundancy', description: 'Use AWS Route53 as primary DNS with Cloudflare as secondary to ensure DNS resolution survives single-provider failures.', sourceAgent: 'Recommendation Agent' }
  ]
};
