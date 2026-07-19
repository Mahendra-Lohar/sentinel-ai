import { query } from '../db/pool.js';

export async function listInvestigations({ status, severity, search } = {}) {
  let conditions = [];
  let params = [];
  let idx = 1;

  if (status) { conditions.push(`status = $${idx++}`); params.push(status); }
  if (severity) { conditions.push(`severity = $${idx++}`); params.push(severity); }
  if (search) { conditions.push(`(title ILIKE $${idx} OR description ILIKE $${idx++})`); params.push(`%${search}%`); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const result = await query(
    `SELECT id, title, description, severity, status, root_cause, confidence, business_impact, scenario_id, created_at, updated_at
     FROM investigations
     ${where}
     ORDER BY created_at DESC
     LIMIT 100`,
    params
  );
  return result.rows;
}

export async function createInvestigation({ title, description, severity, scenarioId, createdBy }) {
  const result = await query(
    `INSERT INTO investigations (title, description, severity, scenario_id, created_by)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [title, description || '', severity || 'P2', scenarioId || null, createdBy]
  );
  return result.rows[0];
}

export async function getInvestigation(id) {
  const result = await query(
    `SELECT i.*, u.name AS created_by_name, u.email AS created_by_email
     FROM investigations i
     LEFT JOIN users u ON u.id = i.created_by
     WHERE i.id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

export async function updateInvestigation(id, patch) {
  const result = await query(
    `UPDATE investigations
     SET status = COALESCE($2, status),
         root_cause = COALESCE($3, root_cause),
         confidence = COALESCE($4, confidence),
         business_impact = COALESCE($5::jsonb, business_impact),
         scenario_id = COALESCE($6, scenario_id),
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [
      id,
      patch.status ?? null,
      patch.rootCause ?? null,
      patch.confidence ?? null,
      patch.businessImpact ? JSON.stringify(patch.businessImpact) : null,
      patch.scenarioId ?? null
    ]
  );
  return result.rows[0] || null;
}

export async function deleteInvestigation(id) {
  await query('DELETE FROM investigations WHERE id = $1', [id]);
}

export async function addEvidence({ investigationId, type, filename, filepath, summary, content, sizeBytes, metadata = {} }) {
  const result = await query(
    `INSERT INTO evidence (investigation_id, type, filename, filepath, summary, content, size_bytes, metadata, extraction_status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
     RETURNING *`,
    [investigationId, type, filename, filepath || null, summary || '', content || null, sizeBytes || null, JSON.stringify(metadata)]
  );
  return result.rows[0];
}

export async function updateEvidence(id, patch) {
  const result = await query(
    `UPDATE evidence
     SET extracted_text = COALESCE($2, extracted_text),
         classification = COALESCE($3, classification),
         mime_type = COALESCE($4, mime_type),
         metadata = COALESCE($5::jsonb, metadata),
         char_count = COALESCE($6, char_count),
         extraction_status = COALESCE($7, extraction_status)
     WHERE id = $1
     RETURNING *`,
    [
      id,
      patch.extractedText ?? null,
      patch.classification ?? null,
      patch.mimeType ?? null,
      patch.metadata ? JSON.stringify(patch.metadata) : null,
      patch.charCount ?? null,
      patch.extractionStatus ?? null
    ]
  );
  return result.rows[0] || null;
}

export async function listEvidence(investigationId) {
  const result = await query(
    `SELECT id, investigation_id, type, filename, filepath, summary, classification, mime_type, 
            extracted_text, char_count, extraction_status, metadata, uploaded_at
     FROM evidence 
     WHERE investigation_id = $1 
     ORDER BY uploaded_at ASC`,
    [investigationId]
  );
  return result.rows;
}

export async function saveAgentResult({ investigationId, agentName, confidence, reasoning, outputJson }) {
  const result = await query(
    `INSERT INTO agent_results (investigation_id, agent_name, confidence, reasoning, output_json)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [investigationId, agentName, confidence, reasoning, JSON.stringify(outputJson || {})]
  );
  return result.rows[0];
}

export async function saveTimelineEvent({ investigationId, occurredAt, label, description, source, confidence }) {
  const result = await query(
    `INSERT INTO timeline_events (investigation_id, occurred_at, label, description, source, confidence)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [investigationId, occurredAt || null, label, description, source || 'aegis', confidence || 0]
  );
  return result.rows[0];
}

export async function saveRecommendation({ investigationId, priority, title, description, category, effort, sourceAgent }) {
  const result = await query(
    `INSERT INTO recommendations (investigation_id, priority, title, description, category, effort, source_agent)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [investigationId, priority, title, description, category || 'immediate', effort || 'medium', sourceAgent || 'aegis']
  );
  return result.rows[0];
}

export async function saveReport({ investigationId, markdown, jsonReport }) {
  const result = await query(
    `INSERT INTO reports (investigation_id, markdown, json_report)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [investigationId, markdown, JSON.stringify(jsonReport || {})]
  );
  return result.rows[0];
}

export async function getInvestigationResults(investigationId) {
  const [evidence, agents, timeline, recommendations, reports] = await Promise.all([
    query(
      `SELECT id, investigation_id, type, filename, classification, mime_type, char_count, 
              extraction_status, metadata, uploaded_at
       FROM evidence WHERE investigation_id = $1 ORDER BY uploaded_at ASC`,
      [investigationId]
    ),
    query('SELECT * FROM agent_results WHERE investigation_id = $1 ORDER BY created_at ASC', [investigationId]),
    query('SELECT * FROM timeline_events WHERE investigation_id = $1 ORDER BY occurred_at ASC NULLS LAST, created_at ASC', [investigationId]),
    query('SELECT * FROM recommendations WHERE investigation_id = $1 ORDER BY priority ASC, created_at ASC', [investigationId]),
    query('SELECT * FROM reports WHERE investigation_id = $1 ORDER BY created_at DESC LIMIT 1', [investigationId])
  ]);

  return {
    evidence: evidence.rows,
    agents: agents.rows,
    timeline: timeline.rows,
    recommendations: recommendations.rows,
    report: reports.rows[0] || null
  };
}
