export const dbConnectionPoolScenario = {
  id: 'incident-02-db-connection-pool',
  title: 'Finova API — PostgreSQL Connection Pool Exhaustion',
  rootCause: 'PostgreSQL max_connections (100) exhausted due to a missing connection.release() call introduced in the user-session service refactor, causing connections to leak and accumulate until the pool was saturated.',
  confidence: 94,
  businessImpact: {
    revenueLossPerHour: 125000,
    affectedUsers: 61400,
    criticalApis: 7,
    severity: 'P0',
    estimatedMttrMinutes: 12,
    summary: 'Full database unavailability for 18 minutes impacted all authenticated API endpoints, causing $125K/hr revenue loss for the fintech platform.'
  },
  agents: [
    { name: 'Log Detective', confidence: 97, reasoning: 'Application logs show "too many connections" errors beginning at 14:22 UTC. Connection acquisition timeout errors accumulate across all services.', findings: ['Error: too many connections (max_connections=100 reached)', 'Connection acquisition timeout after 5000ms across user-service, payment-service, order-service', 'FATAL: remaining connection slots reserved for non-replication superuser', 'Error onset: 14:22:08 UTC — 4 minutes after session-service v2.1.4 deployed'] },
    { name: 'Metrics Analyst', confidence: 93, reasoning: 'Database connection count grew linearly from 45 to 100 over 4 minutes post-deployment. Active queries dropped to 0 as pool saturated, while waiting connections spiked to 847.', findings: ['DB connections: 45 → 100 in 4 minutes (linear growth pattern = leak)', 'Active queries: 847 → 0 (pool exhausted, no new queries possible)', 'API error rate: 0.2% → 100% across all endpoints at 14:22', 'Connection wait time: 0ms → 5000ms timeout at saturation'] },
    { name: 'Git Investigator', confidence: 99, reasoning: 'Session-service v2.1.4 (commit d4f8a91) refactored the auth middleware removing a try-finally block that guaranteed connection.release() on all code paths.', findings: ['Commit d4f8a91: "refactor: simplify session middleware async flow"', 'Removed try-finally in src/middleware/session.js line 47', 'connection.release() no longer called on early-exit auth failures', 'Deployed at 14:18:00 UTC — 4 min before connection exhaustion'] },
    { name: 'Knowledge Agent', confidence: 91, reasoning: 'Runbook DB-CONN-001 identifies connection leak pattern and recommends immediate rollback and pg_terminate_backend() to recover idle connections.', findings: ['Runbook DB-CONN-001 matched: connection pool exhaustion pattern', 'Recommendation: rollback + SELECT pg_terminate_backend() for idle connections', 'Previous incident INC-1203: same root cause, resolved in 8 minutes', 'Prevention: add connection pool monitoring alert at 80% utilization'] },
    { name: 'Vision Analyst', confidence: 87, reasoning: 'Grafana screenshot shows connection count gauge at 100/100 (red), API latency chart showing complete flatline (no successful responses).', findings: ['DB connection gauge: 100/100 (critical red)', 'API latency chart: flatline — 100% requests timing out', 'Connection wait queue visible in pg_stat_activity screenshot', 'Grafana alert triggered at 14:22:15 UTC'] },
    { name: 'Commander Agent', confidence: 94, reasoning: 'All 5 agents confirm: session-service refactor introduced a connection leak. 4 minutes of leaked connections caused total pool exhaustion. Rollback is the fastest remediation.', findings: ['Root cause: missing connection.release() in session middleware', 'Time from deploy to failure: 4 minutes (confirms linear leak)', 'Recovery: rollback + pg_terminate_backend() estimated 12 min total', 'Preventive: add connection pool lint rule to CI pipeline'] }
  ],
  timeline: [
    { at: '2026-07-15T14:18:00Z', label: 'Session Service v2.1.4 Deployed', description: 'Refactored auth middleware deployed. connection.release() removed from error paths.', confidence: 99 },
    { at: '2026-07-15T14:18:30Z', label: 'Connection Leak Begins', description: 'Each failed auth request now leaks one DB connection. 2-3 leaks/second on normal traffic.', confidence: 95 },
    { at: '2026-07-15T14:20:00Z', label: 'Connection Count at 70%', description: 'DB connections reach 70/100. No alert configured. Leak continues undetected.', confidence: 92 },
    { at: '2026-07-15T14:22:00Z', label: 'Pool Exhaustion — P0 Declared', description: 'max_connections (100) reached. All API endpoints begin failing. PagerDuty fires P0.', confidence: 98 },
    { at: '2026-07-15T14:28:00Z', label: 'Root Cause Identified by AEGIS', description: 'AEGIS identified connection leak in session middleware 35 seconds after investigation launch.', confidence: 94 },
    { at: '2026-07-15T14:30:00Z', label: 'Rollback Initiated', description: 'session-service v2.1.3 deployed. pg_terminate_backend() run to clear idle leaked connections.', confidence: 99 }
  ],
  recommendations: [
    { priority: 'P0', category: 'immediate', effort: 'low', title: 'Rollback session-service to v2.1.3', description: 'Immediately rollback commit d4f8a91. Deployment takes ~2 minutes. This stops the leak.', sourceAgent: 'Recommendation Agent' },
    { priority: 'P0', category: 'immediate', effort: 'low', title: 'Terminate Leaked Connections', description: 'Run: SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = \'idle\' AND query_start < NOW() - INTERVAL \'5 minutes\';', sourceAgent: 'Recommendation Agent' },
    { priority: 'P1', category: 'short-term', effort: 'medium', title: 'Add try-finally to All DB Connection Paths', description: 'Audit all DB usage for missing connection.release() calls. Enforce with ESLint rule: no-unreleased-pg-connections.', sourceAgent: 'Recommendation Agent' },
    { priority: 'P1', category: 'short-term', effort: 'low', title: 'Alert on DB Connection Usage >80%', description: 'Add Prometheus alert: db_connections_used / max_connections > 0.80. Include runbook DB-CONN-001 link.', sourceAgent: 'Recommendation Agent' },
    { priority: 'P2', category: 'long-term', effort: 'high', title: 'Implement Connection Pool Proxy', description: 'Deploy PgBouncer as a connection pooler to handle connection limits at the infrastructure level, reducing blast radius of future leaks.', sourceAgent: 'Recommendation Agent' }
  ]
};
