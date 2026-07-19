export const faultyDeploymentScenario = {
  id: 'incident-10-faulty-deployment',
  title: 'VaultCore — Production Deployment with Missing DATABASE_URL',
  rootCause: 'A production deployment via GitHub Actions used an updated workflow file that referenced a renamed secret (DATABASE_URL_PROD instead of DATABASE_URL). The old secret was not renamed in GitHub Settings. The application deployed with DATABASE_URL undefined, causing all database operations to throw connection errors immediately after deployment.',
  confidence: 99,
  businessImpact: {
    revenueLossPerHour: 167000,
    affectedUsers: 52000,
    criticalApis: 14,
    severity: 'P0',
    estimatedMttrMinutes: 8,
    summary: 'Missing DATABASE_URL environment variable caused total application failure immediately after deployment, with 52,000 users unable to access any features for 8 minutes.'
  },
  agents: [
    { name: 'Log Detective', confidence: 99, reasoning: 'Application logs show "DATABASE_URL is not defined" error on first request after deployment at 16:00 UTC. Error occurs in database pool initialization — all endpoints return 500.', findings: ['Error: DATABASE_URL is not defined (thrown at server startup, pool initialization)', 'All HTTP endpoints returning 500: "Database connection not available"', 'Error onset: exactly at 16:00:00 UTC — deployment completion time', 'Previous deployment (v4.8.2) had no errors — v4.8.3 introduced the issue'] },
    { name: 'Metrics Analyst', confidence: 98, reasoning: 'Error rate jumped from 0.1% to 100% at precisely 16:00:00 UTC (deployment timestamp). Zero successful database queries since deployment. Classic bad deployment signature.', findings: ['Error rate: 0.1% → 100% at exactly 16:00:00 UTC', 'Database query success rate: 100% → 0% (connection pool undefined)', 'Deployment v4.8.3 timestamp: 16:00:00 UTC — exact correlation with failure', 'Previous version v4.8.2 traffic was 100% healthy until cutover'] },
    { name: 'Git Investigator', confidence: 99, reasoning: 'GitHub Actions workflow v4.8.3 changed secret reference from ${{ secrets.DATABASE_URL }} to ${{ secrets.DATABASE_URL_PROD }}. GitHub Settings shows DATABASE_URL_PROD secret does not exist — the old DATABASE_URL was never renamed.', findings: ['Commit a8f3c21: "ci: rename secrets to follow PROD suffix convention"', 'Workflow change: ${{ secrets.DATABASE_URL }} → ${{ secrets.DATABASE_URL_PROD }}', 'GitHub Settings → Secrets: DATABASE_URL exists, DATABASE_URL_PROD does NOT exist', 'DATABASE_URL_PROD resolves to empty string in Actions — env var set to undefined'] },
    { name: 'Knowledge Agent', confidence: 97, reasoning: 'Deployment runbook DEP-001 recommends immediate rollback for any deployment causing >50% error rate. Rollback to v4.8.2 takes 3 minutes via GitHub Actions.', findings: ['Runbook DEP-001: Rollback procedure for faulty deployments', 'Immediate: trigger GitHub Actions rollback workflow targeting v4.8.2', 'GitHub Actions rollback: actions/workflow-dispatch on rollback.yml', 'Then: add DATABASE_URL_PROD secret to GitHub Settings or revert workflow change'] },
    { name: 'Vision Analyst', confidence: 96, reasoning: 'GitHub Actions run screenshot shows DATABASE_URL_PROD secret as empty (masked as ***) in the environment variables panel. Deployment run log shows no error during build — issue only visible at runtime.', findings: ['GitHub Actions: DATABASE_URL_PROD shown as masked empty string in run environment', 'No build-time error — missing env var not validated until runtime pool init', 'Deployment run completed "successfully" — secret injection failure is silent'] },
    { name: 'Commander Agent', confidence: 99, reasoning: 'Renamed CI secret reference without creating the new secret. 100% of requests failing since deployment. Fix: rollback to v4.8.2 in 3 minutes OR add DATABASE_URL_PROD secret immediately.', findings: ['Root cause: secret DATABASE_URL_PROD referenced but not created in GitHub Settings', '100% error rate — full service outage since deployment 8 minutes ago', 'Fastest fix: rollback to v4.8.2 (3 min) OR add missing secret (1 min) + redeploy', 'Prevention: secret existence validation gate in deployment workflow'] }
  ],
  timeline: [
    { at: '2026-07-15T15:45:00Z', label: 'v4.8.3 Build Started', description: 'GitHub Actions workflow triggered for v4.8.3. Workflow uses DATABASE_URL_PROD secret (does not exist).', confidence: 99 },
    { at: '2026-07-15T15:58:00Z', label: 'Build Completed — No Errors', description: 'Build passed all tests (tests use DATABASE_URL from test environment — different secret). Secret absence not caught.', confidence: 97 },
    { at: '2026-07-15T16:00:00Z', label: 'v4.8.3 Deployed to Production', description: 'Application starts with DATABASE_URL=undefined. Pool initialization fails. All endpoints return 500.', confidence: 99 },
    { at: '2026-07-15T16:00:15Z', label: 'P0 Alert Fires', description: 'Error rate hits 100%. PagerDuty P0 triggers immediately. On-call team paged.', confidence: 99 },
    { at: '2026-07-15T16:02:00Z', label: 'AEGIS Root Cause in 45 Seconds', description: 'AEGIS identifies missing secret reference from git diff + GitHub Actions log in 45 seconds.', confidence: 99 },
    { at: '2026-07-15T16:08:00Z', label: 'Rollback Complete', description: 'v4.8.2 deployed. DATABASE_URL secret present. All services restored. Error rate: 0.1%.', confidence: 99 }
  ],
  recommendations: [
    { priority: 'P0', category: 'immediate', effort: 'low', title: 'Rollback to v4.8.2 via GitHub Actions', description: 'Trigger rollback workflow: gh workflow run rollback.yml -f version=v4.8.2. Deployment takes ~3 minutes. Alternatively, add DATABASE_URL_PROD secret and redeploy v4.8.3.', sourceAgent: 'Recommendation Agent' },
    { priority: 'P1', category: 'short-term', effort: 'low', title: 'Add Required Secret to GitHub Settings', description: 'Go to GitHub Settings → Secrets → Actions → New Secret: DATABASE_URL_PROD with production database URL. Then redeploy v4.8.3.', sourceAgent: 'Recommendation Agent' },
    { priority: 'P1', category: 'short-term', effort: 'medium', title: 'Add Secret Existence Validation to Deployment Workflow', description: 'Add a pre-deploy step that verifies all required secrets are non-empty. Fail the deployment pipeline if any required environment variable is undefined.', sourceAgent: 'Recommendation Agent' },
    { priority: 'P1', category: 'short-term', effort: 'medium', title: 'Add Smoke Test Step After Deployment', description: 'Add post-deployment smoke test that hits /health and /api/status endpoints. Automatically trigger rollback if health checks fail within 60 seconds of deployment.', sourceAgent: 'Recommendation Agent' },
    { priority: 'P2', category: 'long-term', effort: 'high', title: 'Implement Blue-Green Deployment', description: 'Deploy to blue environment, run smoke tests, shift traffic only if healthy. This prevents any bad deployment from reaching 100% of users.', sourceAgent: 'Recommendation Agent' }
  ]
};
