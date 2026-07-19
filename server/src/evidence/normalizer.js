/**
 * Evidence Normalizer
 * Runs the full pipeline: parse → classify → store in DB.
 * Call this after any file upload or demo data load.
 */

import { parseFile } from './parser.js';
import { classifyEvidence } from './classifier.js';
import * as repo from '../repositories/investigationRepository.js';

/**
 * Process an uploaded file through the full pipeline.
 * Updates the evidence record with extracted_text, classification, mime_type.
 *
 * @param {Object} params
 * @param {string} params.evidenceId - UUID of existing evidence row
 * @param {string} params.filePath - Disk path to uploaded file
 * @param {string} params.filename - Original filename
 * @param {string} params.mimeType - MIME type from multer
 * @returns {Object} Updated evidence row
 */
export async function processEvidence({ evidenceId, filePath, filename, mimeType }) {
  // 1. Parse
  const { extractedText, mimeType: detectedMime, metadata } = await parseFile(filePath, filename, mimeType);

  // 2. Classify
  const classification = classifyEvidence({
    filename,
    mimeType: detectedMime || mimeType,
    extractedText,
    metadata
  });

  // 3. Update DB
  const updated = await repo.updateEvidence(evidenceId, {
    extractedText,
    classification,
    mimeType: detectedMime || mimeType,
    metadata,
    charCount: extractedText?.length || 0,
    extractionStatus: 'complete'
  });

  return updated;
}

/**
 * Process an evidence item created from demo data (no disk file — text already available).
 */
export async function processEvidenceFromText({ evidenceId, filename, mimeType, text }) {
  const classification = classifyEvidence({
    filename,
    mimeType,
    extractedText: text,
    metadata: {}
  });

  const updated = await repo.updateEvidence(evidenceId, {
    extractedText: text,
    classification,
    mimeType: mimeType || 'text/plain',
    metadata: { source: 'demo', charCount: text.length },
    charCount: text.length,
    extractionStatus: 'complete'
  });

  return updated;
}
