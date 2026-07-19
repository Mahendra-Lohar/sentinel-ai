export const ddosAttackScenario = {
  id: 'incident-07-ddos-attack',
  title: 'TerraShield — Layer 7 DDoS Attack on Authentication API',
  rootCause: 'A Layer 7 HTTP flood targeting the POST /api/auth/login endpoint overwhelmed rate limiting. Attackers used 12,400 unique IPs with valid HTTP headers and realistic user agents, bypassing the IP-based WAF rule. Rate limit was per-IP (10 req/min) — the attack distributed requests to never trigger the threshold.',
  confidence: 91,
  businessImpact: {
    revenueLossPerHour: 95000,
    affectedUsers: 89000,
    criticalApis: 2,
    severity: 'P0',
    estimatedMttrMinutes: 28,
    summary: 'Distributed Layer 7 HTTP flood saturated authentication API, blocking 89,000 legitimate users from logging in during peak business hours.'
  },
  agents: [
    { name: 'Log Detective', confidence: 93, reasoning: 'Auth API logs show 847,000 POST /api/auth/login requests in 10 minutes from 12,400 unique IPs. Requests use valid HTTP headers but identical behavioral pattern — synthetic traffic signature.', findings: ['847,000 POST /api/auth/login in 10 minutes (normal: 2,400 req/10min — 35x spike)', '12,400 unique IPs — distributed attack bypassing per-IP rate limit (10/min threshold)', 'Identical request timing pattern: requests spaced exactly 58 seconds apart per IP', 'User agents are valid but 94% share the same Accept-Language: en-US,en;q=0.9 header'] },
    { name: 'Metrics Analyst', confidence: 89, reasoning: 'Auth API CPU at 100%, P95 response time 8,200ms (normal: 180ms). Database connection pool exhausted by bcrypt operations on synthetic login attempts.', findings: ['Auth API CPU: 0% → 100% in 90 seconds', 'P95 response time: 180ms → 8,200ms', 'Legitimate login success rate: 98% → 3% (database pool exhausted)', 'bcrypt operations per second: 847 (each taking 250ms — blocking event loop)'] },
    { name: 'Git Investigator', confidence: 82, reasoning: 'No recent deployments. External threat intelligence confirms DDoS-for-hire service targeting TerraShield following competitor dispute post on Twitter.', findings: ['No deployments in 72 hours — external attack confirmed', 'External threat intel: 12,400 IPs listed in known DDoS-for-hire infrastructure', 'Attack timestamp correlates with Twitter post by @rival_ceo at 09:55 UTC', 'Attack pattern matches known Mēris botnet HTTP flood signature'] },
    { name: 'Knowledge Agent', confidence: 90, reasoning: 'DDoS runbook DDoS-001 recommends Cloudflare "Under Attack" mode + behavioral challenge. Rate limiting must shift from per-IP to endpoint-level with connection fingerprinting.', findings: ['Runbook DDoS-001: Layer 7 HTTP flood response procedure', 'Immediate: Enable Cloudflare "I\'m Under Attack" mode for /api/auth/login', 'Short-term: Add behavioral rate limit — 1000 req/min per endpoint + TLS fingerprinting', 'Long-term: Deploy CAPTCHA on failed login patterns + bot score threshold'] },
    { name: 'Vision Analyst', confidence: 86, reasoning: 'Cloudflare analytics screenshot shows traffic spike pattern — 35x normal volume with geographic distribution matching known botnet infrastructure regions.', findings: ['Cloudflare traffic: 35x spike, distributed across 47 countries', 'Top source countries: US (12%), BR (18%), RU (22%), CN (19%), others (29%)', 'ASN analysis: 94% of traffic from hosting/datacenter ASNs (not residential ISPs)', 'Cloudflare bot score: 85% of requests score > 80 (high bot probability)'] },
    { name: 'Commander Agent', confidence: 91, reasoning: 'Distributed Layer 7 HTTP flood from botnet infrastructure targeted authentication endpoint. Per-IP rate limiting insufficient against distributed attack. Cloudflare challenge mode is immediate mitigation.', findings: ['Root cause: per-IP rate limiting bypassed by 12,400-IP distribution', 'Attack is external — no internal systems compromised', 'Immediate mitigation: Cloudflare "Under Attack" mode blocks synthetic traffic', 'Long-term: behavioral rate limiting + bot fingerprinting required'] }
  ],
  timeline: [
    { at: '2026-07-15T10:00:00Z', label: 'Attack Initiated', description: '12,400-node botnet begins HTTP flood on POST /api/auth/login. Traffic ramps from baseline to 35x in 90 seconds.', confidence: 95 },
    { at: '2026-07-15T10:01:30Z', label: 'Auth API CPU Saturated', description: 'bcrypt operations triggered by synthetic login attempts saturate auth service CPU at 100%.', confidence: 93 },
    { at: '2026-07-15T10:02:00Z', label: 'Legitimate Users Blocked', description: 'Database connection pool exhausted. Real user login success rate drops to 3%.', confidence: 96 },
    { at: '2026-07-15T10:08:00Z', label: 'PagerDuty P0 Alert', description: 'Auth error rate crosses P0 threshold. On-call team engaged.', confidence: 98 },
    { at: '2026-07-15T10:12:00Z', label: 'AEGIS Identifies DDoS Pattern', description: 'AEGIS correlates 12,400 IPs against threat intel database and identifies botnet signature in 48 seconds.', confidence: 91 },
    { at: '2026-07-15T10:28:00Z', label: 'Cloudflare Challenge Mode Active', description: 'Under Attack mode deployed. Bot traffic blocked. Legitimate user login rate restored to 97%.', confidence: 99 }
  ],
  recommendations: [
    { priority: 'P0', category: 'immediate', effort: 'low', title: 'Enable Cloudflare "Under Attack" Mode', description: 'Go to Cloudflare Dashboard → Security → Security Level → "I\'m Under Attack". This adds JS challenge to all requests, blocking most bots immediately.', sourceAgent: 'Recommendation Agent' },
    { priority: 'P0', category: 'immediate', effort: 'medium', title: 'Add Endpoint-Level Rate Limit on /api/auth/login', description: 'Bypass per-IP limits by adding endpoint-level limit: 500 req/min total on /api/auth/login. Reject with 429 after threshold regardless of source IP.', sourceAgent: 'Recommendation Agent' },
    { priority: 'P1', category: 'short-term', effort: 'medium', title: 'Implement TLS Fingerprinting and Bot Score Gating', description: 'Use Cloudflare JA3 fingerprinting to identify bot clients. Block requests with bot score > 70 on authentication endpoints.', sourceAgent: 'Recommendation Agent' },
    { priority: 'P1', category: 'short-term', effort: 'medium', title: 'Add bcrypt Work Factor Protection', description: 'Move bcrypt operations to a separate worker process with queue depth limit. Prevents auth endpoint from exhausting DB pool on high request volume.', sourceAgent: 'Recommendation Agent' },
    { priority: 'P2', category: 'long-term', effort: 'high', title: 'Deploy CAPTCHA on Failed Login Patterns', description: 'Require CAPTCHA after 3 failed logins from same fingerprint. Integrate with hCaptcha or Cloudflare Turnstile for bot-resistant challenge.', sourceAgent: 'Recommendation Agent' }
  ]
};
