-- Migration 003: Evidence pipeline upgrade
-- Adds extracted_text, classification, mime_type to evidence table
-- Fully additive — no drops, no data loss

ALTER TABLE evidence
  ADD COLUMN IF NOT EXISTS extracted_text TEXT,
  ADD COLUMN IF NOT EXISTS classification TEXT,
  ADD COLUMN IF NOT EXISTS mime_type TEXT,
  ADD COLUMN IF NOT EXISTS extraction_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS char_count INTEGER DEFAULT 0;

-- Store content inline (replaces old separate content column if it existed)
ALTER TABLE evidence
  ADD COLUMN IF NOT EXISTS content TEXT;

-- evidence_findings: links agent findings to specific evidence items
CREATE TABLE IF NOT EXISTS evidence_findings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  investigation_id UUID NOT NULL REFERENCES investigations(id) ON DELETE CASCADE,
  evidence_id UUID REFERENCES evidence(id) ON DELETE SET NULL,
  agent_name TEXT NOT NULL,
  finding TEXT NOT NULL,
  confidence INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add effort column to recommendations if missing
ALTER TABLE recommendations
  ADD COLUMN IF NOT EXISTS effort TEXT DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS source_agent TEXT DEFAULT 'aegis';

-- Add scenario_id column to investigations for legacy/demo compat
ALTER TABLE investigations
  ADD COLUMN IF NOT EXISTS scenario_id TEXT;

CREATE INDEX IF NOT EXISTS idx_evidence_classification ON evidence(classification);
CREATE INDEX IF NOT EXISTS idx_evidence_findings_inv ON evidence_findings(investigation_id);
CREATE INDEX IF NOT EXISTS idx_evidence_findings_ev ON evidence_findings(evidence_id);
