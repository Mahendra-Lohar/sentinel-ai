import path from 'node:path';
import fs from 'node:fs/promises';
import * as repo from '../repositories/investigationRepository.js';
import { parseFile } from '../evidence/parser.js';
import { classifyEvidence } from '../evidence/classifier.js';

export async function upload(req, res) {
  const files = req.files || [];
  if (files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' });
  }

  const evidence = [];

  for (const file of files) {
    // 1. Insert initial evidence row
    const ev = await repo.addEvidence({
      investigationId: req.params.id,
      type: path.extname(file.originalname).replace('.', '') || 'file',
      filename: file.originalname,
      filepath: file.path,
      summary: `${file.originalname} uploaded for analysis`,
      sizeBytes: file.size,
      metadata: { size: file.size, mimetype: file.mimetype }
    });

    // 2. Parse the file to extract text
    let extractedText = '';
    let detectedMime = file.mimetype;
    let parsedMetadata = {};

    try {
      const parsed = await parseFile(file.path, file.originalname, file.mimetype);
      extractedText = parsed.extractedText || '';
      detectedMime = parsed.mimeType || file.mimetype;
      parsedMetadata = parsed.metadata || {};
    } catch (parseErr) {
      console.warn(`Failed to parse ${file.originalname}:`, parseErr.message);
      extractedText = `[Parse failed: ${parseErr.message}]`;
    }

    // 3. Classify based on extracted content
    const classification = classifyEvidence({
      filename: file.originalname,
      mimeType: detectedMime,
      extractedText,
      metadata: parsedMetadata
    });

    // 4. Update evidence row with parsed content
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

  res.status(201).json({ evidence });
}

export async function list(req, res) {
  res.json({ evidence: await repo.listEvidence(req.params.id) });
}
