import React from 'react';
import { motion } from 'framer-motion';
import { GitBranch, Radio, Zap } from 'lucide-react';
import { AgentCard } from './AgentCard.jsx';

const agentNames = ['Log Detective', 'Metrics Analyst', 'Git Investigator', 'Knowledge Agent', 'Vision Analyst', 'Commander Agent'];

export function MissionControl({ investigation, events, timeline, rootCause, confidence, businessImpact }) {
  const agents = agentNames.map((name) => {
    const latest = [...events].reverse().find((event) => event.agent === name);
    return { name, progress: latest?.progress || 0, confidence: latest?.confidence, message: latest?.message };
  });

  return (
    <section id="mission" className="mission-grid">
      <div className="panel hero-panel">
        <div className="mission-title">
          <span className="status-dot" />
          <div>
            <p>AEGIS Mission Control</p>
            <h1>{investigation?.title || 'Checkout Failure'}</h1>
          </div>
        </div>
        <div className="confidence-ring">
          <strong>{confidence || investigation?.confidence || 0}%</strong>
          <span>AI Confidence</span>
        </div>
      </div>

      <div className="panel agent-grid">
        {agents.map((agent) => <AgentCard key={agent.name} agent={agent} />)}
      </div>

      <div className="panel live-feed">
        <h2><Radio size={18} /> Live AI Feed</h2>
        <div className="feed-list">
          {events.slice(-10).reverse().map((event, index) => (
            <motion.div
              className="feed-item"
              key={`${event.agent}-${event.message}-${index}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <strong>{event.agent || event.type}</strong>
              <span>{event.message || event.rootCause || 'Investigation update received'}</span>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="panel timeline-panel">
        <h2><GitBranch size={18} /> Evidence Timeline</h2>
        <div className="timeline">
          {timeline.map((event) => (
            <div className="timeline-item" key={event.id || event.label}>
              <span />
              <div>
                <strong>{event.label}</strong>
                <p>{event.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="panel root-cause-panel">
        <h2><Zap size={18} /> Root Cause</h2>
        <strong>{rootCause || investigation?.root_cause || 'Awaiting commander synthesis'}</strong>
        <p>Every conclusion is backed by logs, metrics, deployment history, runbooks, and incident communication.</p>
      </div>

      <div className="panel impact-panel">
        <h2>Business Impact</h2>
        <div className="impact-grid">
          <span>Revenue Loss <strong>${(businessImpact?.revenueLossPerHour || 0).toLocaleString()}/hr</strong></span>
          <span>Affected Users <strong>{(businessImpact?.affectedUsers || 0).toLocaleString()}</strong></span>
          <span>Critical APIs <strong>{businessImpact?.criticalApis || 0}</strong></span>
          <span>MTTR <strong>{businessImpact?.estimatedMttrMinutes || 0} min</strong></span>
        </div>
      </div>
    </section>
  );
}
