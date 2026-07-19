/**
 * AEGIS Orchestrator — Generic Evidence-Driven Investigation Engine
 *
 * This orchestrator does NOT use predefined scenarios.
 * It reads actual evidence from the database, runs it through
 * specialized AI agents, and produces real conclusions.
 *
 * Flow:
 *   Load evidence from DB
 *   → Classify any unclassified evidence
 *   → Run specialist agents in parallel (Log, Metrics, Git, Vision, Knowledge)
 *   → Run synthesis agents (RootCause, Recommendation, Executive)
 *   → Run Commander agent for final synthesis
 *   → Build timeline from evidence timestamps + findings
 *   → Generate postmortem report dynamically
 *   → Save everything to DB
 *   → Emit investigation:completed
 */

import OpenAI from 'openai';
import { env } from '../../config/env.js';
import {
  LogAgent, MetricsAgent, GitAgent, VisionAgent, KnowledgeAgent,
  RootCauseAgent, RecommendationAgent, ExecutiveAgent, CommanderAgent
} from '../agents/agents.js';
import { classifyEvidence } from '../../evidence/classifier.js';
import { buildDynamicReport } from '../../services/reportBuilder.js';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export class AegisOrchestrator {
  constructor({ io, repository }) {
    this.io = io;
    this.repository = repository;
    this.openai = env.openAiApiKey ? new OpenAI({ apiKey: env.openAiApiKey }) : null;
    this.model = env.openAiModel || 'gpt-4.1';
  }

  emit(investigationId, event, payload) {
    if (this.io) {
      this.io.to(investigationId).emit(event, { investigationId, ...payload });
    }
  }

  buildAgentOpts(investigationId) {
    return { io: this.io, investigationId };
  }

  async run({ investigation }) {
    const invId = investigation.id;

    try {
      // Mark as investigating
      await this.repository.updateInvestigation(invId, { status: 'investigating' });
      this.emit(invId, 'investigation:started', {
        message: `AEGIS activated — ${this.openai ? 'OpenAI GPT-4.1' : 'Heuristic Engine'} mode`
      });

      await sleep(300);

      // ── Step 1: Load all evidence from DB ──────────────────────────────────
      let evidence = [];
      try {
        evidence = await this.repository.listEvidence(invId) || [];
      } catch (err) {
        console.warn('Could not load evidence:', err.message);
      }

      this.emit(invId, 'evidence:parsed', {
        message: `Loaded ${evidence.length} evidence file(s) from database`,
        count: evidence.length
      });

      // ── Step 2: Classify any unclassified evidence ─────────────────────────
      let classified = 0;
      for (const ev of evidence) {
        if (!ev.classification && (ev.extracted_text || ev.filename)) {
          const classification = classifyEvidence({
            filename: ev.filename,
            mimeType: ev.mime_type || '',
            extractedText: ev.extracted_text || '',
            metadata: ev.metadata || {}
          });
          await this.repository.updateEvidence(ev.id, { classification });
          ev.classification = classification;
          classified++;
        }
      }

      if (classified > 0) {
        // Refresh evidence after classification
        evidence = await this.repository.listEvidence(invId) || [];
      }

      const classificationSummary = {};
      for (const ev of evidence) {
        const cls = ev.classification || 'unclassified';
        classificationSummary[cls] = (classificationSummary[cls] || 0) + 1;
      }

      this.emit(invId, 'evidence:classified', {
        message: `Evidence classified: ${Object.entries(classificationSummary).map(([k, v]) => `${v}× ${k}`).join(', ')}`,
        summary: classificationSummary
      });

      await sleep(200);

      // Shared agent context
      const agentCtx = { evidence, openai: this.openai, model: this.model };
      const opts = this.buildAgentOpts(invId);

      // ── Step 3: Phase 1 — Specialist agents run in parallel ─────────────────
      const [logResult, metricsResult] = await Promise.all([
        new LogAgent(opts).run({ ...agentCtx }),
        new MetricsAgent(opts).run({ ...agentCtx })
      ]);
      await sleep(150);

      const [gitResult, visionResult] = await Promise.all([
        new GitAgent(opts).run({ ...agentCtx }),
        new VisionAgent(opts).run({ ...agentCtx })
      ]);
      await sleep(150);

      const knowledgeResult = await new KnowledgeAgent(opts).run({ ...agentCtx });
      await sleep(100);

      const specialistResults = [logResult, metricsResult, gitResult, visionResult, knowledgeResult];

      // Save specialist results to DB
      for (const result of specialistResults) {
        await this.repository.saveAgentResult({
          investigationId: invId,
          agentName: result.agentName,
          confidence: result.confidence,
          reasoning: result.reasoning,
          outputJson: {
            findings: result.findings,
            possibleCauses: result.possibleCauses,
            evidenceUsed: result.evidenceUsed,
            detectedServices: result.detectedServices || [],
            detectedTimestamps: result.detectedTimestamps || []
          }
        });
      }

      // ── Step 4: Root cause synthesis ───────────────────────────────────────
      const rootCauseResult = await new RootCauseAgent(opts).run({
        ...agentCtx,
        agentOutputs: specialistResults
      });

      const rootCauseData = {
        rootCause: rootCauseResult.rootCause || rootCauseResult.findings?.[0],
        confidence: rootCauseResult.confidence,
        allFindings: specialistResults.flatMap(r => r.findings || []),
        allCauses: specialistResults.flatMap(r => r.possibleCauses || []),
        affectedServices: [...new Set(specialistResults.flatMap(r => r.detectedServices || []))],
        timelineHints: [...new Set(specialistResults.flatMap(r => r.detectedTimestamps || []))].sort()
      };

      // Emit root cause immediately
      this.emit(invId, 'rootcause:generated', {
        rootCause: rootCauseData.rootCause,
        confidence: rootCauseResult.confidence
      });
      this.emit(invId, 'confidence:updated', { confidence: rootCauseResult.confidence });

      // ── Step 5: Phase 2 — Synthesis agents in parallel ─────────────────────
      const [recResult, execResult] = await Promise.all([
        new RecommendationAgent(opts).run({ ...agentCtx, rootCauseData, agentOutputs: specialistResults }),
        new ExecutiveAgent(opts).run({ ...agentCtx, investigation, rootCauseData, agentOutputs: specialistResults })
      ]);
      await sleep(150);

      // ── Step 6: Commander final synthesis ──────────────────────────────────
      const allAgentResults = [...specialistResults, rootCauseResult, recResult, execResult];
      const commanderResult = await new CommanderAgent(opts).run({
        ...agentCtx,
        investigation,
        agentOutputs: allAgentResults,
        rootCauseData
      });

      // Save synthesis agents to DB
      for (const [result] of [[rootCauseResult], [recResult], [execResult], [commanderResult]]) {
        await this.repository.saveAgentResult({
          investigationId: invId,
          agentName: result.agentName,
          confidence: result.confidence,
          reasoning: result.reasoning,
          outputJson: { findings: result.findings, possibleCauses: result.possibleCauses }
        });
      }

      // ── Step 7: Build timeline from evidence timestamps ─────────────────────
      const allTimestamps = [...new Set(
        allAgentResults.flatMap(a => a.detectedTimestamps || [])
      )].sort();

      // Save timeline events
      const timelineEventsToSave = [];

      // Add evidence-derived timestamps
      for (let i = 0; i < Math.min(allTimestamps.length, 8); i++) {
        const ts = allTimestamps[i];
        const isEarly = i < 2;
        const event = await this.repository.saveTimelineEvent({
          investigationId: invId,
          occurredAt: ts,
          label: isEarly ? 'Pre-incident activity' : 'Incident progression',
          description: `Evidence timestamp detected at ${ts} — correlates with ${rootCauseData.rootCause?.slice(0, 60) || 'incident'}`,
          source: 'aegis-evidence',
          confidence: Math.max(50, rootCauseResult.confidence - 10)
        });
        timelineEventsToSave.push(event);
        this.emit(invId, 'timeline:updated', { event });
        await sleep(80);
      }

      // Add investigation resolution event
      const resolutionEvent = await this.repository.saveTimelineEvent({
        investigationId: invId,
        occurredAt: new Date().toISOString(),
        label: 'AEGIS Investigation Complete',
        description: `Root cause identified: ${rootCauseData.rootCause?.slice(0, 100) || 'Identified'}`,
        source: 'aegis',
        confidence: commanderResult.confidence
      });
      this.emit(invId, 'timeline:updated', { event: resolutionEvent });

      // ── Step 8: Save recommendations ───────────────────────────────────────
      const recommendations = recResult.recommendations || [];
      for (const rec of recommendations) {
        await this.repository.saveRecommendation({
          investigationId: invId,
          priority: rec.priority || 'P2',
          title: rec.title,
          description: rec.description,
          category: rec.category || 'immediate',
          effort: rec.effort || 'medium',
          sourceAgent: 'Recommendation Agent'
        });
      }
      this.emit(invId, 'recommendations:generated', { recommendations });

      // ── Step 9: Build and save postmortem report ───────────────────────────
      const freshResults = await this.repository.getInvestigationResults(invId);
      const reportMarkdown = buildDynamicReport({
        investigation: { ...investigation, openai_used: !!this.openai },
        rootCauseData,
        agentOutputs: freshResults.agents.map(a => ({
          ...a,
          agentName: a.agent_name,
          findings: a.output_json?.findings || [],
          possibleCauses: a.output_json?.possibleCauses || [],
          detectedServices: a.output_json?.detectedServices || []
        })),
        timeline: freshResults.timeline,
        recommendations: freshResults.recommendations,
        evidence: freshResults.evidence
      });

      const report = await this.repository.saveReport({
        investigationId: invId,
        markdown: reportMarkdown,
        jsonReport: {
          rootCause: rootCauseData.rootCause,
          confidence: commanderResult.confidence,
          agentCount: allAgentResults.length,
          evidenceCount: evidence.length
        }
      });

      this.emit(invId, 'report:ready', { report });

      // ── Step 10: Final investigation update ────────────────────────────────
      const businessImpact = execResult.businessImpact || {};
      const finalConfidence = commanderResult.confidence;

      const updated = await this.repository.updateInvestigation(invId, {
        status: 'resolved',
        rootCause: rootCauseData.rootCause,
        confidence: finalConfidence,
        businessImpact
      });

      this.emit(invId, 'confidence:updated', { confidence: finalConfidence });
      this.emit(invId, 'investigation:completed', { investigation: updated });

      return { investigation: updated, report };

    } catch (err) {
      console.error('[AEGIS] Investigation error:', err);
      await this.repository.updateInvestigation(invId, { status: 'failed' });
      this.emit(invId, 'investigation:error', { error: err.message });
      throw err;
    }
  }
}
