/**
 * Heuristic Analyzer
 * 
 * When no OpenAI API key is set, this module provides real text analysis
 * over actual uploaded evidence. It returns structured findings — not
 * hardcoded scenarios — by scanning the real content.
 * 
 * This is a genuine analysis engine, not a fake placeholder.
 */

// ─── Error Pattern Library ─────────────────────────────────────────────────────

const ERROR_PATTERNS = [
  // Redis
  { regex: /redis.*timeout|connection.*redis.*refused|maxmemory|evicted.keys|OOM.*redis/i, finding: 'Redis connection timeout or memory exhaustion detected', category: 'cache', severity: 'high' },
  { regex: /redis.*WRONGTYPE|redis.*READONLY|replica.*lag/i, finding: 'Redis cluster issue — WRONGTYPE error or replica lag', category: 'cache', severity: 'medium' },

  // Database
  { regex: /too many connections|connection.pool.exhausted|deadlock.detected|lock.timeout/i, finding: 'Database connection pool exhaustion or deadlock detected', category: 'database', severity: 'high' },
  { regex: /slow.query|query.time.*[5-9]\d{3}|query.time.*\d{5}/i, finding: 'Slow database queries detected (>5000ms execution time)', category: 'database', severity: 'medium' },
  { regex: /table.*not.*exist|column.*not.*found|relation.*does.*not.*exist/i, finding: 'Database schema mismatch — missing table or column', category: 'database', severity: 'high' },

  // Memory
  { regex: /out.of.memory|OOMKilled|heap.space|java.lang.OutOfMemoryError|Cannot allocate memory/i, finding: 'Out-of-memory (OOM) condition detected', category: 'memory', severity: 'critical' },
  { regex: /memory.leak|growing.heap|heap.dump|GC overhead|gc.pause.*[5-9]\d{3}/i, finding: 'Potential memory leak — growing heap or excessive GC activity', category: 'memory', severity: 'high' },

  // Network / DNS
  { regex: /NXDOMAIN|dns.*failed|getaddrinfo.*ENOTFOUND|Name or service not known/i, finding: 'DNS resolution failure — NXDOMAIN or ENOTFOUND error', category: 'network', severity: 'high' },
  { regex: /connection.refused|ECONNREFUSED|connection.timed.out|ETIMEDOUT/i, finding: 'Network connection refused or timed out', category: 'network', severity: 'high' },
  { regex: /SSL.*expired|certificate.*expired|SSL.*handshake.*fail|x509.*certificate/i, finding: 'SSL/TLS certificate expiration or handshake failure', category: 'security', severity: 'critical' },

  // Application
  { regex: /NullPointerException|undefined is not a function|TypeError|AttributeError/i, finding: 'Null reference or type error in application code', category: 'application', severity: 'medium' },
  { regex: /HTTP 5[0-9]{2}|status.*5[0-9]{2}|500 Internal Server|503 Service Unavailable/i, finding: 'HTTP 5xx server error responses detected', category: 'application', severity: 'high' },
  { regex: /HTTP 429|rate.limit.exceeded|too.many.requests/i, finding: 'HTTP 429 rate limiting — requests being throttled', category: 'application', severity: 'medium' },
  { regex: /ENOSPC|no space left on device|disk.full|inode/i, finding: 'Disk space exhaustion — filesystem full', category: 'infrastructure', severity: 'critical' },

  // Payment / Business
  { regex: /payment.*fail|charge.*declined|stripe.*error|gateway.*timeout|transaction.*error/i, finding: 'Payment processing failure or gateway timeout', category: 'payments', severity: 'critical' },

  // DDoS / Security
  { regex: /flood|syn.flood|udp.flood|amplification.attack|suspicious.*traffic.*spike/i, finding: 'Potential DDoS or traffic amplification attack pattern', category: 'security', severity: 'critical' },

  // Deployment
  { regex: /rollback|deployment.*fail|pod.*crash|CrashLoopBackOff|ImagePullBackOff/i, finding: 'Deployment failure or container crash loop', category: 'deployment', severity: 'high' },
  { regex: /config.*changed|env.*variable.*missing|config.*mismatch/i, finding: 'Configuration change or missing environment variable', category: 'deployment', severity: 'medium' },

  // Generic errors (Catch-all for arbitrary logs)
  { regex: /(?:exception|fatal|panic|traceback):? (.*?)(?:\n|$)/i, finding: 'Critical exception or panic in application execution', category: 'application', severity: 'high' },
  { regex: /error:? (.*?)(?:\n|$)/i, finding: 'Generic application error encountered', category: 'application', severity: 'medium' },
  { regex: /warn(?:ing)?:? (.*?)(?:\n|$)/i, finding: 'Warning level logs detected', category: 'application', severity: 'low' },
  { regex: /fail(?:ed|ure)?:? (.*?)(?:\n|$)/i, finding: 'Operation failure recorded in logs', category: 'application', severity: 'medium' }
];

// ─── Metric Spike Detection ────────────────────────────────────────────────────

function detectMetricAnomalies(text) {
  const findings = [];

  // CPU spike pattern
  const cpuMatches = text.match(/cpu[_\s]*usage[^\d]*(\d+(?:\.\d+)?)\s*%/gi) || [];
  for (const m of cpuMatches) {
    const val = parseFloat(m.match(/(\d+(?:\.\d+)?)/)?.[1] || 0);
    if (val > 85) findings.push(`High CPU usage detected: ${val}%`);
  }

  // Memory pressure
  const memMatches = text.match(/memory[_\s]*usage[^\d]*(\d+(?:\.\d+)?)\s*%/gi) || [];
  for (const m of memMatches) {
    const val = parseFloat(m.match(/(\d+(?:\.\d+)?)/)?.[1] || 0);
    if (val > 90) findings.push(`Critical memory pressure: ${val}%`);
  }

  // Latency spike
  const latencyMatches = text.match(/(?:p99|p95|latency|response_time)[^\d]*(\d+)\s*ms/gi) || [];
  for (const m of latencyMatches) {
    const val = parseInt(m.match(/(\d+)/)?.[1] || 0);
    if (val > 2000) findings.push(`High latency spike detected: ${val}ms`);
  }

  // Error rate
  const errRateMatches = text.match(/error[_\s]*rate[^\d]*(\d+(?:\.\d+)?)\s*%/gi) || [];
  for (const m of errRateMatches) {
    const val = parseFloat(m.match(/(\d+(?:\.\d+)?)/)?.[1] || 0);
    if (val > 5) findings.push(`Elevated error rate: ${val}%`);
  }

  return findings;
}

// ─── Timestamp Extractor ───────────────────────────────────────────────────────

function extractTimestamps(text) {
  const pattern = /(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?)/g;
  const all = [...(text.match(pattern) || [])];
  // Sort and deduplicate
  const sorted = [...new Set(all)].sort();
  return sorted.slice(0, 20); // max 20 timestamps
}

// ─── Key Term Extractor ────────────────────────────────────────────────────────

function extractKeyTerms(text) {
  const servicePattern = /\b(api[-_]?gateway|auth[-_]?service|payment[-_]?service|redis|postgres|mysql|nginx|kafka|rabbitmq|elasticsearch|kubernetes|docker)\b/gi;
  const terms = [...new Set((text.match(servicePattern) || []).map(t => t.toLowerCase()))];
  return terms.slice(0, 10);
}

// ─── Main Analysis Function ────────────────────────────────────────────────────

/**
 * Analyze a collection of evidence texts and return structured findings.
 * @param {Array<{classification, extractedText, filename}>} evidenceItems
 * @param {string} agentType - 'log' | 'metrics' | 'git' | 'vision' | 'knowledge' | 'commander'
 * @returns {{ findings: string[], possibleCauses: string[], confidence: number, reasoning: string }}
 */
export function analyzeEvidence(evidenceItems, agentType) {
  if (!evidenceItems || evidenceItems.length === 0) {
    return {
      findings: ['No relevant evidence available for analysis'],
      possibleCauses: [],
      evidenceUsed: [],
      confidence: 20,
      reasoning: 'No evidence of this type was uploaded.'
    };
  }

  const allText = evidenceItems.map(e => e.extractedText || '').join('\n\n---\n\n');
  const allFindings = [];
  const matchedPatterns = [];

  // Run error pattern matching
  for (const pattern of ERROR_PATTERNS) {
    if (pattern.regex.test(allText)) {
      allFindings.push(pattern.finding);
      matchedPatterns.push({ finding: pattern.finding, category: pattern.category, severity: pattern.severity });
    }
  }

  // Run metric anomaly detection for metrics/logs
  if (['metrics', 'log', 'commander'].includes(agentType)) {
    const metricFindings = detectMetricAnomalies(allText);
    allFindings.push(...metricFindings);
  }

  // Extract key services mentioned
  const services = extractKeyTerms(allText);
  const timestamps = extractTimestamps(allText);

  // Build possible causes from matched categories
  const categoryCount = {};
  for (const p of matchedPatterns) {
    categoryCount[p.category] = (categoryCount[p.category] || 0) + 1;
  }
  const dominantCategory = Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0];

  const possibleCauses = [];
  if (matchedPatterns.some(p => p.severity === 'critical')) {
    possibleCauses.push(`Critical-severity issue in ${dominantCategory?.[0] || 'system'} layer`);
  }
  if (services.length > 0) {
    possibleCauses.push(`Affected services: ${services.join(', ')}`);
  }
  if (timestamps.length > 1) {
    possibleCauses.push(`Incident began around: ${timestamps[0]}`);
  }

  // Calculate confidence based on findings
  let baseConfidence = Math.min(40 + (allFindings.length * 10), 85);
  const hasCritical = matchedPatterns.some(p => p.severity === 'critical');
  const hasHigh = matchedPatterns.some(p => p.severity === 'high');
  
  if (hasCritical) baseConfidence += 15;
  else if (hasHigh) baseConfidence += 10;
  
  const confidence = Math.min(baseConfidence, 92);

  const reasoning = allFindings.length > 0
    ? `Analyzed ${evidenceItems.length} evidence file(s). Found ${allFindings.length} anomaly pattern(s) across ${Object.keys(categoryCount).join(', ') || 'general'} categories. ${services.length > 0 ? `Detected services: ${services.join(', ')}.` : ''}`
    : `Analyzed ${evidenceItems.length} evidence file(s). No specific error patterns matched. Content appears benign or requires manual review.`;

  return {
    findings: allFindings.length > 0 ? allFindings : ['No anomalies detected in this evidence type'],
    possibleCauses,
    evidenceUsed: evidenceItems.map(e => ({ id: e.id, filename: e.filename, classification: e.classification })),
    confidence,
    reasoning,
    detectedServices: services,
    detectedTimestamps: timestamps,
    matchedCategories: Object.keys(categoryCount)
  };
}

/**
 * Generate a root cause conclusion from all agent findings.
 */
export function synthesizeRootCause(agentOutputs) {
  const allFindings = agentOutputs.flatMap(a => a.findings || []);
  const allCauses = agentOutputs.flatMap(a => a.possibleCauses || []);
  const allServices = [...new Set(agentOutputs.flatMap(a => a.detectedServices || []))];
  const allTimestamps = [...new Set(agentOutputs.flatMap(a => a.detectedTimestamps || []))].sort();

  const avgConfidence = agentOutputs.length
    ? Math.round(agentOutputs.reduce((s, a) => s + (a.confidence || 0), 0) / agentOutputs.length)
    : 50;

  // Find the most critical finding
  const criticalKeywords = ['OOM', 'memory exhaustion', 'DDoS', 'disk space', 'SSL.*expired', 'connection pool', 'Redis', 'deadlock', 'deployment failure', 'DNS', 'exception', 'fatal', 'panic'];
  let rootCause = null;

  for (const kw of criticalKeywords) {
    const regex = new RegExp(kw, 'i');
    const match = allFindings.find(f => regex.test(f));
    if (match) {
      rootCause = match;
      break;
    }
  }

  if (!rootCause && allFindings.length > 0) {
    // If no specific critical keyword matched, just use the first non-generic warning finding
    rootCause = allFindings.find(f => !f.includes('Warning level')) || allFindings[0];
  }

  if (!rootCause) {
    rootCause = 'Root cause could not be determined from uploaded evidence. Logs appear benign or lack clear error indicators.';
  }

  return {
    rootCause,
    confidence: Math.min(avgConfidence + 5, 96),
    allFindings,
    allCauses,
    affectedServices: allServices,
    timelineHints: allTimestamps
  };
}

/**
 * Generate recommendations from root cause and agent findings.
 */
export function generateRecommendations(rootCauseData) {
  const recs = [];
  const { rootCause = '', allFindings = [] } = rootCauseData;

  const combined = [rootCause, ...allFindings].join(' ').toLowerCase();

  // Redis
  if (/redis|cache/.test(combined)) {
    recs.push({ priority: 'P0', category: 'immediate', effort: 'low', title: 'Restart Redis service and flush excess keys', description: 'Immediately restart the Redis instance and evict non-critical keys. Check maxmemory-policy setting.' });
    recs.push({ priority: 'P1', category: 'short-term', effort: 'medium', title: 'Implement Redis memory alerting at 75% threshold', description: 'Set up CloudWatch or Prometheus alerts to fire before OOM conditions occur.' });
  }

  // Database
  if (/database|connection.pool|deadlock|slow.query/.test(combined)) {
    recs.push({ priority: 'P0', category: 'immediate', effort: 'low', title: 'Increase database connection pool size', description: 'Immediately increase max_connections and tune pool sizing for peak load.' });
    recs.push({ priority: 'P1', category: 'short-term', effort: 'medium', title: 'Add slow query logging and index optimization', description: 'Enable pg_stat_statements and identify top slow queries for optimization.' });
  }

  // Memory
  if (/memory|oom|heap/.test(combined)) {
    recs.push({ priority: 'P0', category: 'immediate', effort: 'low', title: 'Increase memory allocation or restart affected pods', description: 'Scale up instances or restart OOM-killed processes immediately.' });
    recs.push({ priority: 'P1', category: 'short-term', effort: 'high', title: 'Profile memory usage and fix memory leak', description: 'Use heap profiling tools to identify the leak source and patch the code.' });
  }

  // SSL
  if (/ssl|certificate|tls/.test(combined)) {
    recs.push({ priority: 'P0', category: 'immediate', effort: 'low', title: 'Renew SSL/TLS certificate immediately', description: 'Renew the expired certificate using Let\'s Encrypt or your CA. Verify auto-renewal configuration.' });
    recs.push({ priority: 'P2', category: 'long-term', effort: 'low', title: 'Set up certificate expiry monitoring', description: 'Implement a monitoring job that alerts 30 days before certificate expiry.' });
  }

  // DNS
  if (/dns|nxdomain|getaddrinfo/.test(combined)) {
    recs.push({ priority: 'P0', category: 'immediate', effort: 'low', title: 'Verify DNS records and TTL settings', description: 'Check your DNS provider for misconfigured or missing records.' });
  }

  // Deployment
  if (/deploy|rollback|crash|crashloop/.test(combined)) {
    recs.push({ priority: 'P0', category: 'immediate', effort: 'low', title: 'Roll back to last known good deployment', description: 'Immediately revert to the previous stable version while root cause is investigated.' });
    recs.push({ priority: 'P1', category: 'short-term', effort: 'high', title: 'Implement canary deployments and automatic rollback', description: 'Deploy to 5% of traffic first, monitor error rate, and auto-rollback on threshold breach.' });
  }

  // Network / DDoS
  if (/ddos|flood|rate.limit/.test(combined)) {
    recs.push({ priority: 'P0', category: 'immediate', effort: 'medium', title: 'Enable DDoS protection and rate limiting', description: 'Activate Cloudflare/AWS Shield DDoS mitigation and configure aggressive rate limiting.' });
  }

  // Disk
  if (/disk|enospc|no space/.test(combined)) {
    recs.push({ priority: 'P0', category: 'immediate', effort: 'low', title: 'Free disk space immediately', description: 'Delete old logs, temporary files, and rotate log retention policies.' });
    recs.push({ priority: 'P1', category: 'short-term', effort: 'low', title: 'Set up disk space alerting at 80% threshold', description: 'Configure monitoring alerts and automated log rotation to prevent recurrence.' });
  }

  // Generic fallback
  if (recs.length === 0) {
    recs.push({ priority: 'P1', category: 'immediate', effort: 'medium', title: 'Gather additional diagnostic information', description: 'Collect more detailed logs and metrics to identify the root cause.' });
    recs.push({ priority: 'P2', category: 'short-term', effort: 'low', title: 'Implement comprehensive monitoring and alerting', description: 'Set up observability stack (metrics, logs, traces) to catch future incidents earlier.' });
  }

  // Always add postmortem
  recs.push({ priority: 'P2', category: 'long-term', effort: 'low', title: 'Complete postmortem and update runbooks', description: 'Document this incident, update runbooks, and schedule a blameless postmortem meeting.' });

  return recs.slice(0, 6);
}
