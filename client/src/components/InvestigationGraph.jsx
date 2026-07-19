import React, { useMemo } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Box, Typography } from '@mui/material';

export default function InvestigationGraph({ investigation, results }) {
  const { evidence = [], agents = [] } = results || {};
  const rootCause = investigation?.root_cause;
  
  const initialNodes = useMemo(() => {
    const nodes = [];
    let yEvidence = 50;
    
    // 1. Evidence Nodes
    evidence.forEach((ev, i) => {
      nodes.push({
        id: `ev-${ev.id}`,
        position: { x: 50, y: yEvidence },
        data: { label: ev.filename },
        style: { background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px' }
      });
      yEvidence += 80;
    });

    // 2. Agent Nodes
    let yAgent = 50;
    agents.forEach((agent, i) => {
      nodes.push({
        id: `agent-${agent.id}`,
        position: { x: 350, y: yAgent },
        data: { label: agent.agent_name },
        style: { background: 'rgba(14,144,119,0.2)', color: '#16c7a2', border: '1px solid rgba(22,199,162,0.3)', borderRadius: '8px', padding: '10px' }
      });
      yAgent += 80;
    });

    // 3. Commander Synthesis Node
    if (rootCause) {
      nodes.push({
        id: 'commander',
        position: { x: 650, y: (Math.max(yEvidence, yAgent) / 2) - 40 },
        data: { label: 'Commander Agent' },
        style: { background: 'rgba(244,183,97,0.2)', color: '#f4b761', border: '1px solid rgba(244,183,97,0.4)', borderRadius: '8px', padding: '10px' }
      });
    }

    // 4. Root Cause Node
    if (rootCause) {
      nodes.push({
        id: 'root-cause',
        position: { x: 950, y: (Math.max(yEvidence, yAgent) / 2) - 40 },
        data: { label: 'Root Cause Identified' },
        style: { background: 'rgba(239,83,80,0.2)', color: '#ef5350', border: '1px solid rgba(239,83,80,0.5)', borderRadius: '8px', padding: '10px', fontWeight: 'bold' }
      });
    }

    return nodes;
  }, [evidence, agents, rootCause]);

  const initialEdges = useMemo(() => {
    const edges = [];
    
    // Connect evidence to all agents (simplified)
    evidence.forEach(ev => {
      agents.forEach(agent => {
        // In reality, map evidence.classification to agent.agent_name, but we connect all for visual flow
        edges.push({
          id: `e-ev${ev.id}-agent${agent.id}`,
          source: `ev-${ev.id}`,
          target: `agent-${agent.id}`,
          animated: true,
          style: { stroke: 'rgba(255,255,255,0.2)' }
        });
      });
    });

    if (rootCause) {
      agents.forEach(agent => {
        edges.push({
          id: `e-agent${agent.id}-commander`,
          source: `agent-${agent.id}`,
          target: 'commander',
          animated: true,
          style: { stroke: 'rgba(22,199,162,0.4)' },
          markerEnd: { type: MarkerType.ArrowClosed, color: 'rgba(22,199,162,0.4)' }
        });
      });

      if (rootCause) {
        edges.push({
          id: `e-commander-rc`,
          source: 'commander',
          target: 'root-cause',
          animated: true,
          style: { stroke: 'rgba(244,183,97,0.6)', strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: 'rgba(244,183,97,0.6)' }
        });
      }
    }

    return edges;
  }, [evidence, agents, rootCause]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes/edges if results change
  React.useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  return (
    <Box sx={{ width: '100%', height: '500px', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden', position: 'relative' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        colorMode="dark"
        minZoom={0.5}
        maxZoom={2}
      >
        <Background color="rgba(255,255,255,0.05)" gap={16} />
        <Controls showInteractive={false} />
      </ReactFlow>
      
      {!rootCause && agents.length === 0 && (
        <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
          <Typography color="text.secondary">Waiting for AI investigation to begin...</Typography>
        </Box>
      )}
    </Box>
  );
}
