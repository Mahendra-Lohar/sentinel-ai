export const diskFullScenario = {
  id: 'incident-08-disk-full',
  title: 'DataVault — Write Failures from /var/log Disk Exhaustion',
  rootCause: 'Verbose debug logging accidentally enabled in production during a hotfix (LOG_LEVEL=debug) caused log files to grow at 2.8GB/hour instead of the normal 120MB/hour. The /var/log partition (20GB) filled completely in 7 hours, causing PostgreSQL WAL writes, Nginx access logging, and application writes to fail.',
  confidence: 98,
  businessImpact: {
    revenueLossPerHour: 42000,
    affectedUsers: 27600,
    criticalApis: 6,
    severity: 'P1',
    estimatedMttrMinutes: 15,
    summary: 'Disk exhaustion on /var/log caused all write operations to fail, including database WAL writes. 27,600 users experienced transaction failures and data write errors.'
  },
  agents: [
    { name: 'Log Detective', confidence: 99, reasoning: 'System logs show "No space left on device" errors starting at 14:30 UTC. Log files show LOG_LEVEL=debug producing 46MB of log per minute. /var/log is 100% full.', findings: ['write error: No space left on device (/var/log partition — 20GB / 20GB used)', 'LOG_LEVEL=debug detected in running process environment — set during hotfix at 07:30 UTC', 'Log growth rate: 46MB/min (normal: 2MB/min — 23x increase)', 'PostgreSQL: PANIC: could not write to file "pg_wal/00000001": No space left on device'] },
    { name: 'Metrics Analyst', confidence: 97, reasoning: 'Disk usage graph shows linear growth from 14GB to 20GB over 7 hours, reaching 100% at 14:30. Write IOPS dropped to 0 at disk saturation. Read IOPS unaffected.', findings: ['/var/log usage: 14GB → 20GB (100%) in 7 hours', 'Write IOPS: 2,400 → 0 at 14:30 UTC (disk full)', 'Log write rate: 46MB/min vs normal 2MB/min (debug mode)', 'PostgreSQL WAL write latency: 0ms → ∞ (writes failing)'] },
    { name: 'Git Investigator', confidence: 98, reasoning: 'Hotfix deployment at 07:30 UTC set LOG_LEVEL=debug in production environment variables. The hotfix .env patch was not reverted. Debug mode left active for 7 hours.', findings: ['Hotfix deploy at 07:30 UTC: commit f2a9c81 "fix: increase session timeout for enterprise users"', 'Hotfix used debug .env.debug file that set LOG_LEVEL=debug', 'DEBUG mode NOT reverted after hotfix — active for 7+ hours', 'Normal: LOG_LEVEL=warn (2MB/min). Debug: LOG_LEVEL=debug (46MB/min)'] },
    { name: 'Knowledge Agent', confidence: 96, reasoning: 'Runbook DISK-001: immediately compress or delete old logs, set LOG_LEVEL=warn, restart services. Then expand /var/log or implement log rotation.', findings: ['Runbook DISK-001: Disk full recovery procedure', 'Immediate: rm -rf /var/log/*.gz && find /var/log -name "*.log" -mtime +1 -delete', 'Then: set LOG_LEVEL=warn and restart application', 'Then: systemctl reload postgresql (WAL writes will resume)', 'Permanent: implement logrotate with daily rotation and 7-day retention'] },
    { name: 'Vision Analyst', confidence: 95, reasoning: 'Grafana disk usage chart shows clear linear growth trend reaching 100% at 14:30. Disk saturation correlates precisely with debug mode activation at 07:30.', findings: ['Disk usage chart: linear growth from 07:30 to 14:30 (7 hours)', 'Saturation point: 14:30 UTC — correlates with all write failures', 'Log rate chart: step change from 2MB/min to 46MB/min at 07:30 UTC'] },
    { name: 'Commander Agent', confidence: 98, reasoning: 'Debug logging accidentally left active after hotfix filled /var/log in 7 hours. Recovery is immediate: clear old logs + set LOG_LEVEL=warn. Root cause is operational process failure.', findings: ['Root cause: LOG_LEVEL=debug left active post-hotfix for 7 hours', '/var/log partition 100% full — all writes failing including PostgreSQL WAL', 'Recovery: ~15 minutes via log cleanup + env var fix', 'Prevention: hotfix checklist must include LOG_LEVEL verification'] }
  ],
  timeline: [
    { at: '2026-07-15T07:30:00Z', label: 'Hotfix Deployed with Debug Logging', description: 'Hotfix for session timeout deployed with LOG_LEVEL=debug active. Log rate increases from 2MB/min to 46MB/min.', confidence: 99 },
    { at: '2026-07-15T12:00:00Z', label: 'Disk Usage at 80%', description: '/var/log partition reaches 80% (16GB of 20GB). No alert configured at this threshold.', confidence: 95 },
    { at: '2026-07-15T14:00:00Z', label: 'PostgreSQL WAL Warnings', description: 'PostgreSQL begins logging disk space warnings. WAL writes starting to slow.', confidence: 94 },
    { at: '2026-07-15T14:30:00Z', label: 'Disk Full — All Writes Fail', description: '/var/log partition at 100% (20GB). All write operations fail. Postgres PANIC. Application writes returning ENOSPC.', confidence: 99 },
    { at: '2026-07-15T14:35:00Z', label: 'AEGIS Identifies Disk Full + Debug Mode', description: 'AEGIS correlates disk saturation with debug mode activation in 22 seconds.', confidence: 98 },
    { at: '2026-07-15T14:45:00Z', label: 'Recovery Complete', description: 'Old logs deleted, LOG_LEVEL=warn set, services restarted. Full write capability restored.', confidence: 99 }
  ],
  recommendations: [
    { priority: 'P0', category: 'immediate', effort: 'low', title: 'Clear Old Log Files and Free Disk Space', description: 'Run: find /var/log -name "*.log" -mtime +0 -exec truncate -s 0 {} \\; to free space immediately. Then delete compressed archives.', sourceAgent: 'Recommendation Agent' },
    { priority: 'P0', category: 'immediate', effort: 'low', title: 'Set LOG_LEVEL=warn and Restart Services', description: 'Update LOG_LEVEL=warn in production environment. Restart application and reload PostgreSQL to resume WAL writes.', sourceAgent: 'Recommendation Agent' },
    { priority: 'P1', category: 'short-term', effort: 'medium', title: 'Implement logrotate with Daily Rotation', description: 'Configure logrotate to rotate logs daily, compress after 1 day, delete after 7 days. Size limit: 1GB per log file.', sourceAgent: 'Recommendation Agent' },
    { priority: 'P1', category: 'short-term', effort: 'low', title: 'Add Disk Usage Alert at 70%', description: 'Create Prometheus alert: disk_usage_percent > 70. Include /var/log specifically since it fills faster than / during debug events.', sourceAgent: 'Recommendation Agent' },
    { priority: 'P2', category: 'long-term', effort: 'medium', title: 'Add LOG_LEVEL Verification to Hotfix Checklist', description: 'Update deployment runbook to require LOG_LEVEL verification before and after hotfix. Add CI check that rejects deployments with LOG_LEVEL=debug targeting production environment.', sourceAgent: 'Recommendation Agent' }
  ]
};
