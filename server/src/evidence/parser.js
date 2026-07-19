/**
 * Evidence Parser
 * Extracts text content from any uploaded file.
 * Supports: .log, .txt, .json, .csv, .xml, .md, .png, .jpg, .zip, and more.
 * Returns an object: { extractedText, mimeType, metadata }
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { createReadStream } from 'node:fs';
import { createGunzip } from 'node:zlib';

const MAX_TEXT_CHARS = 80000; // ~20k tokens max per file

/**
 * Parse a file and return its text content + metadata.
 * @param {string} filePath - Absolute path to the file
 * @param {string} originalName - Original filename (for extension detection)
 * @param {string} mimeType - MIME type reported by multer
 */
export async function parseFile(filePath, originalName, mimeType = '') {
  const ext = path.extname(originalName).toLowerCase().replace('.', '');
  const stat = await fs.stat(filePath).catch(() => ({ size: 0 }));

  try {
    switch (ext) {
      case 'log':
      case 'txt':
      case 'md':
      case 'markdown':
      case 'sh':
      case 'yaml':
      case 'yml':
      case 'toml':
      case 'env':
        return await parseTextFile(filePath, stat);

      case 'json':
        return await parseJsonFile(filePath, stat);

      case 'csv':
        return await parseCsvFile(filePath, stat);

      case 'xml':
      case 'html':
        return await parseXmlFile(filePath, stat);

      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'webp':
      case 'bmp':
        return parseImageFile(filePath, originalName, stat);

      case 'zip':
        return await parseZipFile(filePath, stat);

      default:
        // Try to read as text anyway
        return await parseTextFile(filePath, stat);
    }
  } catch (err) {
    return {
      extractedText: `[Parse error: ${err.message}]`,
      mimeType: mimeType || 'application/octet-stream',
      metadata: { size: stat.size, parseError: err.message }
    };
  }
}

async function parseTextFile(filePath, stat) {
  const raw = await fs.readFile(filePath, 'utf-8');
  const text = raw.slice(0, MAX_TEXT_CHARS);
  const lines = raw.split('\n').length;

  // Extract timestamps if present
  const timestampPattern = /\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}/g;
  const timestamps = [...new Set((raw.match(timestampPattern) || []).slice(0, 20))];

  // Detect error patterns
  const errorPattern = /\b(ERROR|FATAL|CRITICAL|Exception|Traceback|panic|WARN|Warning)\b/gi;
  const errorMatches = raw.match(errorPattern) || [];
  const errorCount = errorMatches.length;

  // Extract unique error types
  const errorTypes = [...new Set(errorMatches.map(e => e.toUpperCase()))];

  return {
    extractedText: text,
    mimeType: 'text/plain',
    metadata: {
      size: stat.size,
      lines,
      charCount: text.length,
      truncated: raw.length > MAX_TEXT_CHARS,
      timestamps: timestamps.slice(0, 10),
      errorCount,
      errorTypes,
      hasErrors: errorCount > 0
    }
  };
}

async function parseJsonFile(filePath, stat) {
  const raw = await fs.readFile(filePath, 'utf-8');
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // Not valid JSON — treat as text
    return parseTextFile(filePath, stat);
  }

  // Convert to a readable text representation
  const text = JSON.stringify(parsed, null, 2).slice(0, MAX_TEXT_CHARS);
  const keys = typeof parsed === 'object' && parsed !== null ? Object.keys(parsed) : [];

  // Detect if it's git/PR/deployment data
  const isGitData = keys.some(k => ['commits', 'sha', 'author', 'diff', 'pull_request', 'deployment'].includes(k.toLowerCase()));
  const isMetrics = keys.some(k => ['cpu', 'memory', 'latency', 'rps', 'metrics', 'datapoints'].includes(k.toLowerCase()));

  return {
    extractedText: text,
    mimeType: 'application/json',
    metadata: {
      size: stat.size,
      charCount: text.length,
      topLevelKeys: keys.slice(0, 20),
      isGitData,
      isMetrics,
      recordCount: Array.isArray(parsed) ? parsed.length : null
    }
  };
}

async function parseCsvFile(filePath, stat) {
  const raw = await fs.readFile(filePath, 'utf-8');
  const lines = raw.trim().split('\n');
  const headers = lines[0]?.split(',').map(h => h.trim().replace(/"/g, '')) || [];
  const rowCount = lines.length - 1;

  // Sample first 100 rows for analysis
  const sample = lines.slice(0, 101).join('\n');
  const text = `CSV File — Headers: ${headers.join(', ')}\nRow count: ${rowCount}\n\nSample data:\n${sample}`.slice(0, MAX_TEXT_CHARS);

  // Detect metric columns (numeric headers like cpu, memory, latency, error_rate)
  const metricKeywords = ['cpu', 'mem', 'memory', 'latency', 'p99', 'p95', 'rps', 'rpm', 'error', 'rate', 'bytes', 'ms', 'count', 'value'];
  const isMetrics = headers.some(h => metricKeywords.some(k => h.toLowerCase().includes(k)));

  // Try to extract timestamps
  const timestampPattern = /\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}/g;
  const timestamps = [...new Set((raw.match(timestampPattern) || []).slice(0, 10))];

  return {
    extractedText: text,
    mimeType: 'text/csv',
    metadata: {
      size: stat.size,
      headers,
      rowCount,
      isMetrics,
      timestamps
    }
  };
}

async function parseXmlFile(filePath, stat) {
  const raw = await fs.readFile(filePath, 'utf-8');
  // Strip XML tags, preserve values
  const text = raw
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_TEXT_CHARS);

  return {
    extractedText: `[XML Document]\n${text}`,
    mimeType: 'application/xml',
    metadata: { size: stat.size, charCount: text.length }
  };
}

function parseImageFile(filePath, originalName, stat) {
  // Images cannot be text-extracted without Vision API.
  // We store the path reference so the Vision Agent can use it.
  return {
    extractedText: `[IMAGE: ${originalName}] — Size: ${(stat.size / 1024).toFixed(1)} KB. This file will be analyzed by the Vision Agent using image analysis. The image may contain dashboards, error screens, graphs, or screenshots.`,
    mimeType: 'image/png',
    metadata: {
      size: stat.size,
      isImage: true,
      imagePath: filePath,
      originalName
    }
  };
}

async function parseZipFile(filePath, stat) {
  // Note: Full ZIP extraction requires the 'adm-zip' package.
  // For now, note the ZIP and return a placeholder.
  // In a production system, install adm-zip and recursively parse.
  return {
    extractedText: `[ZIP Archive: ${path.basename(filePath)}] — Size: ${(stat.size / 1024).toFixed(1)} KB. Contains compressed files. Extract and re-upload individual files for detailed analysis.`,
    mimeType: 'application/zip',
    metadata: { size: stat.size, isZip: true }
  };
}
