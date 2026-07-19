/**
 * BaseAgent
 * All AEGIS agents extend this class.
 * Provides: socket emission, structured output format, timing.
 */
export class BaseAgent {
  constructor(name, { io, investigationId }) {
    this.name = name;
    this.io = io;
    this.investigationId = investigationId;
  }

  emit(event, payload) {
    if (this.io) {
      this.io.to(this.investigationId).emit(event, {
        investigationId: this.investigationId,
        agent: this.name,
        ...payload
      });
    }
  }

  async run(context) {
    this.emit('agent:started', { message: `${this.name} activated` });
    try {
      const result = await this.investigate(context);
      this.emit('agent:completed', {
        confidence: result.confidence,
        findings: result.findings,
        message: result.reasoning
      });
      return { ...result, agentName: this.name };
    } catch (err) {
      this.emit('agent:completed', { confidence: 0, findings: [`${this.name} encountered an error: ${err.message}`], message: 'Error during investigation' });
      return { agentName: this.name, findings: [], confidence: 0, reasoning: err.message, evidenceUsed: [], possibleCauses: [] };
    }
  }

  // Subclasses implement this
  async investigate(_context) {
    throw new Error('investigate() must be implemented by subclass');
  }
}
