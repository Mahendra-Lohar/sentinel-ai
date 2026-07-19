import React from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';

export function AgentCard({ agent }) {
  const completed = agent.progress >= 100;

  return (
    <article className="agent-card">
      <div className="agent-card__header">
        <div>
          <strong>{agent.name}</strong>
          <span>{agent.message || 'Waiting for launch'}</span>
        </div>
        {completed ? <CheckCircle2 className="ok" /> : <Loader2 className="spin" />}
      </div>
      <div className="progress">
        <span style={{ width: `${agent.progress || 0}%` }} />
      </div>
      <div className="agent-card__meta">
        <span>{agent.progress || 0}%</span>
        <span>{agent.confidence ? `${agent.confidence}% confidence` : 'standby'}</span>
      </div>
    </article>
  );
}
