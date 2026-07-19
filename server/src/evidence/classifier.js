/**
 * Evidence Classifier
 * Automatically classifies uploaded evidence into semantic categories.
 * Uses pattern-matching — NO OpenAI API call required.
 * 
 * Classifications:
 *   application_log, system_log, metrics, screenshot,
 *   git_commit, deployment, runbook, documentation,
 *   support_ticket, database_report, general_document
 */

const CLASSIFICATIONS = {
  application_log: {
    label: 'Application Log',
    icon: '📋',
    agentAffinity: 'Log Detective'
  },
  system_log: {
    label: 'System Log',
    icon: '🖥️',
    agentAffinity: 'Log Detective'
  },
  metrics: {
    label: 'Metrics / Time Series',
    icon: '📊',
    agentAffinity: 'Metrics Analyst'
  },
  screenshot: {
    label: 'Screenshot / Dashboard',
    icon: '🖼️',
    agentAffinity: 'Vision Analyst'
  },
  git_commit: {
    label: 'Git / Deployment History',
    icon: '🌿',
    agentAffinity: 'Git Investigator'
  },
  deployment: {
    label: 'Deployment Record',
    icon: '🚀',
    agentAffinity: 'Git Investigator'
  },
  runbook: {
    label: 'Runbook / Playbook',
    icon: '📚',
    agentAffinity: 'Knowledge Agent'
  },
  documentation: {
    label: 'Documentation',
    icon: '📄',
    agentAffinity: 'Knowledge Agent'
  },
  support_ticket: {
    label: 'Support Ticket',
    icon: '🎫',
    agentAffinity: 'Knowledge Agent'
  },
  database_report: {
    label: 'Database Report',
    icon: '🗄️',
    agentAffinity: 'Metrics Analyst'
  },
  general_document: {
    label: 'General Document',
    icon: '📝',
    agentAffinity: 'Knowledge Agent'
  }
};

// Ordered rules: first match wins
const CLASSIFICATION_RULES = [
  {
    classification: 'screenshot',
    test: ({ mimeType, ext }) => mimeType?.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'].includes(ext)
  },
  {
    classification: 'git_commit',
    test: ({ text, ext, filename, metadata }) =>
      ext === 'json' && (metadata?.isGitData || false) ||
      /\b(commit|sha|author|git log|git diff|git blame|pull.request|merge request)\b/i.test(text) ||
      /diff --git/.test(text)
  },
  {
    classification: 'deployment',
    test: ({ text, filename }) =>
      /\b(deploy|deployment|release|rollout|helm install|kubectl apply|terraform apply|ansible|CI\/CD|pipeline)\b/i.test(text) ||
      /\b(docker build|docker push|artifact|build.id|image.tag)\b/i.test(text) ||
      /(deploy|release|pipeline)/i.test(filename)
  },
  {
    classification: 'metrics',
    test: ({ text, ext, filename, metadata }) =>
      ext === 'csv' && (metadata?.isMetrics || false) ||
      ext === 'json' && (metadata?.isMetrics || false) ||
      /\b(cpu|memory|latency|p99|p95|p50|rps|rpm|throughput|error.rate|request.count|bytes.per.second|heap.used|gc.pause)\b/i.test(text) ||
      /\b(prometheus|grafana|datadog|cloudwatch|metric|time.series)\b/i.test(text) ||
      /(metrics|prometheus|grafana|cloudwatch|datadog)/i.test(filename)
  },
  {
    classification: 'database_report',
    test: ({ text, filename }) =>
      /\b(SELECT|INSERT|UPDATE|DELETE|slow.query|query.time|lock.wait|deadlock|transaction|postgres|mysql|mongodb|redis)\b/i.test(text) ||
      /\b(pg_stat|slow_log|explain.analyze|index.scan|seq.scan)\b/i.test(text) ||
      /(database|db.report|slow.query|pg_)/i.test(filename)
  },
  {
    classification: 'support_ticket',
    test: ({ text, filename }) =>
      /\b(ticket|jira|issue.id|customer.complaint|bug.report|priority|assignee|status.open|reporter)\b/i.test(text) ||
      /\b(customers.are.reporting|users.cannot|error.message.from.user|complaint)\b/i.test(text) ||
      /(jira|ticket|complaint|support)/i.test(filename)
  },
  {
    classification: 'runbook',
    test: ({ text, ext, filename }) =>
      (ext === 'md' || ext === 'markdown' || ext === 'txt') &&
      (/\b(runbook|playbook|procedure|steps.to.resolve|how.to.fix|on.call|incident.response)\b/i.test(text) ||
       /##.*(steps|procedure|resolution|mitigation|rollback)/i.test(text)) ||
      /(runbook|playbook|procedure)/i.test(filename)
  },
  {
    classification: 'documentation',
    test: ({ text, ext, filename }) =>
      (ext === 'md' || ext === 'markdown') &&
      /\b(architecture|configuration|setup|overview|README|API.reference|service.description)\b/i.test(text) ||
      /(docs|readme|architecture|config)/i.test(filename)
  },
  {
    classification: 'system_log',
    test: ({ text }) =>
      /\b(kernel|syslog|systemd|journald|dmesg|cron|OOM killer|out.of.memory|segfault|core.dump)\b/i.test(text)
  },
  {
    classification: 'application_log',
    test: ({ text, ext }) =>
      ext === 'log' ||
      /\b(ERROR|FATAL|WARN|INFO|DEBUG|TRACE|Exception|Traceback|stack.trace|NullPointerException|TypeError|404|500|503)\b/.test(text) ||
      /\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}/.test(text)
  }
];

/**
 * Classify a piece of evidence based on its content and metadata.
 * @param {Object} params
 * @param {string} params.filename
 * @param {string} params.mimeType
 * @param {string} params.extractedText
 * @param {Object} params.metadata
 * @returns {string} classification key
 */
export function classifyEvidence({ filename, mimeType, extractedText = '', metadata = {} }) {
  const ext = filename?.split('.').pop()?.toLowerCase() || '';
  const text = extractedText.slice(0, 10000); // Use first 10k chars for classification

  const context = { filename, mimeType, ext, text, metadata };

  for (const rule of CLASSIFICATION_RULES) {
    if (rule.test(context)) {
      return rule.classification;
    }
  }

  return 'general_document';
}

/**
 * Get metadata about a classification.
 */
export function getClassificationInfo(classification) {
  return CLASSIFICATIONS[classification] || CLASSIFICATIONS.general_document;
}

/**
 * Get agent affinity — which agent should primarily handle this evidence type.
 */
export function getAgentForClassification(classification) {
  return CLASSIFICATIONS[classification]?.agentAffinity || 'Knowledge Agent';
}

export { CLASSIFICATIONS };
