import { z } from 'zod';
import fs from 'node:fs/promises';
import path from 'node:path';
import * as repo from '../repositories/investigationRepository.js';
import { AegisOrchestrator } from '../ai/orchestrator/aegisOrchestrator.js';
import { processEvidenceFromText } from '../evidence/normalizer.js';
import { dispatchIntegration as triggerIntegration } from '../services/integrationService.js';

const createSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(2000).default(''),
  severity: z.enum(['P0', 'P1', 'P2', 'P3']).default('P1'),
});

export async function list(req, res) {
  const { status, severity, search } = req.query;
  const investigations = await repo.listInvestigations({ status, severity, search, createdBy: req.user.id });
  res.json({ investigations });
}

export async function create(req, res) {
  const body = createSchema.parse(req.body);
  const investigation = await repo.createInvestigation({
    title: body.title,
    description: body.description,
    severity: body.severity,
    createdBy: req.user.id
  });
  res.status(201).json({ investigation });
}

export async function get(req, res) {
  const investigation = await repo.getInvestigation(req.params.id, req.user.id);
  if (!investigation) return res.status(404).json({ error: 'Investigation not found' });

  const results = await repo.getInvestigationResults(req.params.id);
  return res.json({ investigation, results });
}

export async function remove(req, res) {
  const investigation = await repo.getInvestigation(req.params.id, req.user.id);
  if (!investigation) return res.status(404).json({ error: 'Investigation not found' });
  await repo.deleteInvestigation(req.params.id);
  res.status(204).send();
}

/**
 * Load a demo evidence pack as real files.
 * The files are read from disk, parsed, classified, and stored in the DB
 * exactly like a real upload. The AI investigates them as real evidence.
 */
export async function loadDemo(req, res) {
  const investigation = await repo.getInvestigation(req.params.id, req.user.id);
  if (!investigation) return res.status(404).json({ error: 'Investigation not found' });

  const demoId = req.params.scenarioId || 'incident-01-redis-timeout';
  const demoDir = path.join(process.cwd(), 'demo-data', demoId);

  let files;
  try {
    files = await fs.readdir(demoDir);
  } catch {
    // Fallback to incident-01 if requested demo doesn't exist yet
    const fallbackDir = path.join(process.cwd(), 'demo-data', 'incident-01-redis-timeout');
    try {
      files = await fs.readdir(fallbackDir);
      files = files.map(f => ({ name: f, dir: fallbackDir }));
    } catch {
      return res.status(404).json({ error: `Demo data not found for: ${demoId}` });
    }
  }

  if (typeof files[0] === 'string') {
    files = files.map(f => ({ name: f, dir: demoDir }));
  }

  const { parseFile } = await import('../evidence/parser.js');
  const { classifyEvidence } = await import('../evidence/classifier.js');
  const evidence = [];

  for (const fileInfo of files) {
    const filename = fileInfo.name;
    const filePath = path.join(fileInfo.dir, filename);

    let stat;
    try {
      stat = await fs.stat(filePath);
      if (stat.isDirectory()) continue;
    } catch { continue; }

    // Insert evidence row
    const ev = await repo.addEvidence({
      investigationId: req.params.id,
      type: path.extname(filename).replace('.', '') || 'file',
      filename,
      filepath: filePath,
      summary: `Demo evidence: ${filename}`,
      sizeBytes: stat.size,
      metadata: { source: 'demo', demoId }
    });

    // Parse the actual file
    let extractedText = '';
    let detectedMime = 'text/plain';
    let parsedMetadata = {};

    try {
      const parsed = await parseFile(filePath, filename);
      extractedText = parsed.extractedText || '';
      detectedMime = parsed.mimeType || 'text/plain';
      parsedMetadata = parsed.metadata || {};
    } catch (err) {
      console.warn(`Demo file parse error: ${filename}:`, err.message);
    }

    // Classify
    const classification = classifyEvidence({
      filename,
      mimeType: detectedMime,
      extractedText,
      metadata: parsedMetadata
    });

    // Update with extracted content
    const updated = await repo.updateEvidence(ev.id, {
      extractedText,
      classification,
      mimeType: detectedMime,
      metadata: parsedMetadata,
      charCount: extractedText.length,
      extractionStatus: 'complete'
    });

    evidence.push(updated || ev);
  }

  res.status(201).json({ evidence, demoId, message: `Loaded ${evidence.length} demo evidence files. Launch investigation to analyze.` });
}

export async function launch(req, res) {
  const investigation = await repo.getInvestigation(req.params.id, req.user.id);
  if (!investigation) return res.status(404).json({ error: 'Investigation not found' });

  if (investigation.status === 'investigating') {
    return res.status(409).json({ error: 'Investigation already running' });
  }

  const orchestrator = new AegisOrchestrator({ io: req.app.get('io'), repository: repo });
  orchestrator.run({ investigation }).catch((error) => {
    console.error('AEGIS error:', error);
    req.app.get('io')?.to(req.params.id).emit('investigation:error', {
      investigationId: req.params.id,
      error: error.message
    });
  });

  res.status(202).json({ message: 'AEGIS investigation launched', investigationId: req.params.id });
}

export async function results(req, res) {
  const results = await repo.getInvestigationResults(req.params.id);
  res.json({ results });
}

export async function dispatchIntegration(req, res) {
  const { id } = req.params;
  const { target } = req.body; // 'slack', 'jira', or 'pagerduty'

  if (!target) return res.status(400).json({ error: 'Target integration missing' });

  try {
    const investigation = await repo.getInvestigation(id, req.user.id);
    if (!investigation) return res.status(404).json({ error: 'Investigation not found' });

    const results = await repo.getInvestigationResults(id);
    
    const dispatchResult = await triggerIntegration(investigation, results, target);
    res.json(dispatchResult);
  } catch (error) {
    console.error(`Integration to ${target} failed:`, error);
    res.status(500).json({ error: error.message || 'Integration dispatch failed' });
  }
}
