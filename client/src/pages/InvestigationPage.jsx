import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Grid, Card, CardContent, Typography, Button, Chip, IconButton,
  CircularProgress, LinearProgress, Divider, Avatar, Tooltip, alpha, Tabs, Tab
} from '@mui/material';
import {
  PlayArrow, Refresh, FileUpload, Chat as ChatIcon, Assessment,
  CheckCircle, RadioButtonChecked, HourglassEmpty, Error as ErrorIcon,
  Bolt, Timeline as TimelineIcon, Psychology, TrendingUp, Shield
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { AppShell } from '../components/AppShell.jsx';
import { createSocket } from '../services/socket.js';
import { getInvestigation, getResults, launchInvestigation, loadDemoEvidence } from '../services/api.js';
import InvestigationGraph from '../components/InvestigationGraph';
import IntegrationsHub from '../components/IntegrationsHub';

const AGENT_ICONS = {
  'Log Detective': '🔍',
  'Metrics Analyst': '📊',
  'Git Investigator': '🌿',
  'Vision Analyst': '👁️',
  'Knowledge Agent': '📚',
  'Root Cause Agent': '⚡',
  'Recommendation Agent': '💡',
  'Executive Agent': '📋',
  'Commander Agent': '🎯',
};

const SEV_COLORS = { P0: '#ff6b6b', P1: '#f4b761', P2: '#60a5fa', P3: '#a9c7c1' };
const STATUS_COLORS = { draft: '#a9c7c1', investigating: '#f4b761', resolved: '#16c7a2', failed: '#ff6b6b' };

const CLASSIFICATION_ICONS = {
  application_log: '📋', system_log: '🖥️', metrics: '📊', screenshot: '🖼️',
  git_commit: '🌿', deployment: '🚀', runbook: '📚', documentation: '📄',
  support_ticket: '🎫', database_report: '🗄️', general_document: '📝', unclassified: '❓'
};

const PIPELINE_STAGES = [
  { key: 'started', label: 'Started' },
  { key: 'parsed', label: 'Evidence Parsed' },
  { key: 'classified', label: 'Classified' },
  { key: 'agents', label: 'Agents Active' },
  { key: 'rootcause', label: 'Root Cause' },
  { key: 'complete', label: 'Complete' },
];

function ConfidenceRing({ value, size = 120 }) {
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = circumference - (value / 100) * circumference;

  return (
    <Box sx={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', position: 'absolute' }}>
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={10} />
        <motion.circle
          cx={size/2} cy={size/2} r={radius} fill="none"
          stroke="url(#confGradient)" strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: progress }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
        <defs>
          <linearGradient id="confGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#16c7a2" />
            <stop offset="100%" stopColor="#4dd8b8" />
          </linearGradient>
        </defs>
      </svg>
      <Box sx={{ textAlign: 'center', zIndex: 1 }}>
        <Typography variant="h5" fontWeight={900} sx={{ color: 'primary.main', lineHeight: 1 }}>
          {value}%
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
          confidence
        </Typography>
      </Box>
    </Box>
  );
}

function AgentCard({ name, agentState }) {
  const status = agentState?.status || 'idle';
  const progress = agentState?.progress || 0;
  const confidence = agentState?.confidence || 0;

  const statusConfig = {
    idle: { color: 'text.disabled', icon: <HourglassEmpty sx={{ fontSize: 16 }} />, label: 'Standby' },
    running: { color: '#f4b761', icon: <RadioButtonChecked sx={{ fontSize: 16, animation: 'pulse 1s infinite' }} />, label: 'Investigating' },
    completed: { color: '#16c7a2', icon: <CheckCircle sx={{ fontSize: 16 }} />, label: 'Complete' },
    error: { color: '#ff6b6b', icon: <ErrorIcon sx={{ fontSize: 16 }} />, label: 'Error' },
  };

  const cfg = statusConfig[status] || statusConfig.idle;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <Card sx={{
        height: '100%',
        border: status === 'running' ? '1px solid rgba(244,183,97,0.35)' : status === 'completed' ? '1px solid rgba(22,199,162,0.25)' : undefined,
        boxShadow: status === 'running' ? '0 0 20px rgba(244,183,97,0.1)' : status === 'completed' ? '0 0 20px rgba(22,199,162,0.08)' : 'none',
        transition: 'all 0.3s ease',
      }}>
        <CardContent sx={{ p: 1.8 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography sx={{ fontSize: '1.1rem' }}>{AGENT_ICONS[name] || '🤖'}</Typography>
              <Typography variant="body2" fontWeight={700} sx={{ fontSize: '0.82rem' }}>{name}</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: cfg.color }}>
              {cfg.icon}
              <Typography variant="caption" sx={{ color: cfg.color, fontWeight: 600, fontSize: '0.7rem' }}>{cfg.label}</Typography>
            </Box>
          </Box>

          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 5, borderRadius: 3, mb: 1,
              background: 'rgba(255,255,255,0.07)',
              '& .MuiLinearProgress-bar': {
                background: status === 'completed' ? 'linear-gradient(90deg, #16c7a2, #4dd8b8)' :
                  status === 'running' ? 'linear-gradient(90deg, #f4b761, #f7c884)' : 'rgba(255,255,255,0.2)',
                transition: 'transform 0.4s ease'
              }
            }}
          />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem', flex: 1, mr: 1 }} noWrap>
              {agentState?.message || 'Awaiting activation'}
            </Typography>
            {confidence > 0 && (
              <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 700, fontSize: '0.72rem', flexShrink: 0 }}>
                {confidence}%
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function InvestigationPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [investigation, setInvestigation] = useState(null);
  const [results, setResults] = useState({ evidence: [], agents: [], timeline: [], recommendations: [], report: null });
  const [events, setEvents] = useState([]);
  const [agentStates, setAgentStates] = useState({});
  const [rootCause, setRootCause] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [launching, setLaunching] = useState(false);
  const [pipelineStage, setPipelineStage] = useState('idle');
  const [evidenceSummary, setEvidenceSummary] = useState(null);
  const [consoleTab, setConsoleTab] = useState(0);
  const feedRef = useRef(null);

  const businessImpact = useMemo(() => investigation?.business_impact || {}, [investigation]);
  const allAgentNames = Object.keys(AGENT_ICONS);

  useEffect(() => {
    getInvestigation(id).then((data) => {
      setInvestigation(data.investigation);
      setResults(data.results);
      setRootCause(data.investigation.root_cause || '');
      setConfidence(data.investigation.confidence || 0);
      if (data.results.agents?.length) {
        const states = {};
        data.results.agents.forEach(a => {
          states[a.agent_name] = { status: 'completed', progress: 100, confidence: a.confidence, message: a.reasoning };
        });
        setAgentStates(states);
      }
    });
  }, [id]);

  useEffect(() => {
    const socket = createSocket();
    socket.emit('investigation:join', { investigationId: id });

    const addEvent = (type) => (payload) => {
      setEvents(cur => [...cur, { type, ts: Date.now(), ...payload }]);
      if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight;
    };

    socket.on('investigation:started', (payload) => {
      addEvent('investigation:started')(payload);
      setPipelineStage('started');
    });

    socket.on('evidence:parsed', (payload) => {
      addEvent('evidence:parsed')(payload);
      setPipelineStage('parsed');
    });

    socket.on('evidence:classified', (payload) => {
      addEvent('evidence:classified')(payload);
      setPipelineStage('classified');
      if (payload.summary) setEvidenceSummary(payload.summary);
    });

    socket.on('agent:started', (payload) => {
      addEvent('agent:started')(payload);
      setPipelineStage('agents');
      setAgentStates(s => ({ ...s, [payload.agent]: { status: 'running', progress: payload.progress || 5, message: payload.message } }));
    });

    socket.on('agent:progress', (payload) => {
      setAgentStates(s => ({ ...s, [payload.agent]: { status: 'running', progress: payload.progress || 50, message: payload.message, confidence: payload.confidence } }));
    });

    socket.on('agent:completed', (payload) => {
      addEvent('agent:completed')(payload);
      setAgentStates(s => ({ ...s, [payload.agent]: { status: 'completed', progress: 100, message: payload.message, confidence: payload.confidence } }));
    });

    socket.on('timeline:updated', (payload) => {
      addEvent('timeline:updated')(payload);
      setResults(cur => ({ ...cur, timeline: [...(cur.timeline || []), payload.event] }));
    });

    socket.on('confidence:updated', (payload) => {
      setConfidence(payload.confidence);
    });

    socket.on('rootcause:generated', (payload) => {
      setPipelineStage('rootcause');
      setRootCause(payload.rootCause);
    });

    socket.on('recommendations:generated', (payload) => {
      addEvent('recommendations:generated')(payload);
    });

    socket.on('report:ready', (payload) => {
      setResults(cur => ({ ...cur, report: payload.report }));
    });

    socket.on('investigation:completed', async (payload) => {
      setInvestigation(payload.investigation);
      setLaunching(false);
      addEvent('investigation:completed')(payload);
      const fresh = await getResults(id);
      setResults(fresh);
    });

    socket.on('investigation:error', (payload) => {
      addEvent('investigation:error')(payload);
      setLaunching(false);
    });

    return () => {
      socket.emit('investigation:leave', { investigationId: id });
    };
  }, [id]);

  async function handleLaunch() {
    setEvents([]);
    setAgentStates({});
    setRootCause('');
    setConfidence(0);
    setLaunching(true);
    await launchInvestigation(id);
  }

  async function handleLoadDemo() {
    const scenarioId = investigation?.scenario_id || 'incident-01-redis-timeout';
    await loadDemo(id, scenarioId);
    const data = await getInvestigation(id);
    setResults(data.results);
  }

  const isInvestigating = investigation?.status === 'investigating' || launching;
  const isResolved = investigation?.status === 'resolved';

  return (
    <AppShell>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <Chip
                label={investigation?.severity || 'P1'}
                size="small"
                sx={{ background: alpha(SEV_COLORS[investigation?.severity] || '#f4b761', 0.15), color: SEV_COLORS[investigation?.severity] || '#f4b761', fontWeight: 800 }}
              />
              <Chip
                label={isInvestigating ? 'Investigating' : investigation?.status || 'draft'}
                size="small"
                sx={{ background: alpha(STATUS_COLORS[isInvestigating ? 'investigating' : investigation?.status] || '#a9c7c1', 0.15), color: STATUS_COLORS[isInvestigating ? 'investigating' : investigation?.status], fontWeight: 700 }}
              />
            </Box>
            <Typography variant="h4" fontWeight={900} sx={{ mb: 0.5 }}>
              {investigation?.title || 'Loading…'}
            </Typography>
            <Typography variant="body2" color="text.secondary">{investigation?.description}</Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button size="small" variant="outlined" startIcon={<FileUpload />} onClick={handleLoadDemo}>
              Load Demo Evidence
            </Button>
            <Button
              variant="contained"
              startIcon={isInvestigating ? <CircularProgress size={16} sx={{ color: 'inherit' }} /> : <PlayArrow />}
              onClick={handleLaunch}
              disabled={isInvestigating}
              sx={{ minWidth: 180 }}
            >
              {isInvestigating ? 'AEGIS Investigating…' : 'Launch Investigation'}
            </Button>
            {isResolved && (
              <>
                <Tooltip title="View Postmortem"><IconButton size="small" variant="outlined" onClick={() => navigate(`/investigations/${id}/report`)}><Assessment /></IconButton></Tooltip>
                <Tooltip title="AI Chat"><IconButton size="small" onClick={() => navigate(`/investigations/${id}/chat`)}><ChatIcon /></IconButton></Tooltip>
              </>
            )}
          </Box>
        </Box>

        {/* AEGIS Mission Control Banner */}
        <Card sx={{
          mb: 3, p: 0,
          background: 'linear-gradient(135deg, rgba(12,30,35,0.95), rgba(14,144,119,0.1))',
          border: '1px solid rgba(22,199,162,0.2)',
          boxShadow: isInvestigating ? '0 0 40px rgba(22,199,162,0.12)' : 'none',
          transition: 'box-shadow 0.5s ease',
        }}>
          <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{
                width: 12, height: 12, borderRadius: '50%',
                background: isInvestigating ? '#f4b761' : isResolved ? '#16c7a2' : 'rgba(255,255,255,0.2)',
                boxShadow: isInvestigating ? '0 0 15px #f4b761' : isResolved ? '0 0 15px #16c7a2' : 'none',
                animation: isInvestigating ? 'pulse 1.5s infinite' : 'none',
              }} />
              <Box>
                <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 800, display: 'block', lineHeight: 1.2 }}>
                  AEGIS Mission Control
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {isInvestigating ? 'Multi-agent investigation in progress…' : isResolved ? 'Investigation complete — findings available' : 'Ready to launch investigation'}
                </Typography>
              </Box>
            </Box>

            {(isInvestigating || isResolved) && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', justifyContent: 'center', flex: 1, px: 2 }}>
                {PIPELINE_STAGES.map((stage, idx) => {
                  const stageIdx = PIPELINE_STAGES.findIndex(s => s.key === pipelineStage);
                  const isActive = pipelineStage === stage.key && !isResolved;
                  const isDone = PIPELINE_STAGES.findIndex(s => s.key === stage.key) < stageIdx || isResolved;
                  
                  return (
                    <React.Fragment key={stage.key}>
                      <Chip
                        label={stage.label}
                        size="small"
                        sx={{
                          background: isActive ? 'rgba(244,183,97,0.15)' : isDone ? 'rgba(22,199,162,0.15)' : 'rgba(255,255,255,0.05)',
                          color: isActive ? '#f4b761' : isDone ? '#16c7a2' : 'text.disabled',
                          border: isActive ? '1px solid rgba(244,183,97,0.3)' : isDone ? '1px solid rgba(22,199,162,0.3)' : '1px solid transparent',
                          fontWeight: isActive || isDone ? 700 : 500,
                          fontSize: '0.65rem', height: 22
                        }}
                      />
                      {idx < PIPELINE_STAGES.length - 1 && (
                        <Box sx={{ width: 12, height: 2, background: isDone || isActive ? '#16c7a2' : 'rgba(255,255,255,0.1)', borderRadius: 1 }} />
                      )}
                    </React.Fragment>
                  );
                })}
              </Box>
            )}

            <ConfidenceRing value={confidence || investigation?.confidence || 0} size={100} />
          </Box>
        </Card>

        {/* Main Grid */}
        <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
          {/* Agent Grid */}
          <Grid item xs={12} md={7}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ p: 2.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Psychology sx={{ color: 'primary.main' }} />
                    <Typography variant="h6" fontWeight={700}>AI Processing</Typography>
                  </Box>
                  <Tabs value={consoleTab} onChange={(e, v) => setConsoleTab(v)} sx={{ minHeight: 32, '& .MuiTab-root': { minHeight: 32, py: 0, px: 2, fontSize: '0.8rem' } }}>
                    <Tab label="Agent Console" />
                    <Tab label="Knowledge Graph" />
                  </Tabs>
                </Box>
                
                {consoleTab === 0 ? (
                  <Grid container spacing={1.5}>
                    {allAgentNames.map(name => (
                      <Grid item xs={6} sm={4} key={name}>
                        <AgentCard name={name} agentState={agentStates[name]} />
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Box sx={{ flex: 1, minHeight: 400 }}>
                    <InvestigationGraph investigation={investigation} results={results} />
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Live Feed */}
          <Grid item xs={12} md={5}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ p: 2.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <RadioButtonChecked sx={{ color: '#f4b761', fontSize: 18 }} />
                  <Typography variant="h6" fontWeight={700}>Live Activity Feed</Typography>
                </Box>
                <Box ref={feedRef} sx={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 0.8, maxHeight: 360 }}>
                  {events.length === 0 ? (
                    <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography variant="body2" color="text.disabled" sx={{ textAlign: 'center' }}>
                        Launch investigation to see<br />real-time agent activity
                      </Typography>
                    </Box>
                  ) : (
                    <AnimatePresence>
                      {events.slice(-20).map((event, i) => (
                        <motion.div key={`${event.ts}-${i}`} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>
                          <Box sx={{ p: 1.2, borderRadius: 1.5, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 700, display: 'block', fontSize: '0.7rem' }}>
                              {AGENT_ICONS[event.agent] || '⚡'} {event.agent || event.type}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.72rem' }}>
                              {event.message || event.rootCause || 'Update received'}
                            </Typography>
                          </Box>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
          {/* Root Cause */}
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%', border: rootCause ? '1px solid rgba(22,199,162,0.2)' : undefined }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <Bolt sx={{ color: 'primary.main' }} />
                  <Typography variant="h6" fontWeight={700}>Root Cause</Typography>
                </Box>
                {rootCause ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
                    <Typography variant="body1" sx={{ color: 'primary.main', fontWeight: 600, lineHeight: 1.6, mb: 1.5 }}>
                      {rootCause}
                    </Typography>
                    {confidence > 0 && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <LinearProgress variant="determinate" value={confidence}
                          sx={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)',
                            '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg, #16c7a2, #4dd8b8)' } }} />
                        <Typography variant="body2" fontWeight={700} color="primary.main">{confidence}% confident</Typography>
                      </Box>
                    )}
                  </motion.div>
                ) : (
                  <Typography variant="body2" color="text.disabled">
                    {isInvestigating ? 'AEGIS is synthesizing evidence…' : 'Launch investigation to generate root cause analysis'}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Business Impact */}
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <TrendingUp sx={{ color: 'secondary.main' }} />
                  <Typography variant="h6" fontWeight={700}>Business Impact</Typography>
                </Box>
                {Object.keys(businessImpact).length > 0 ? (
                  <Grid container spacing={1.5}>
                    {[
                      { label: 'Revenue Loss', value: `$${(businessImpact.revenueLossPerHour || 0).toLocaleString()}/hr`, color: '#ff6b6b' },
                      { label: 'Affected Users', value: (businessImpact.affectedUsers || 0).toLocaleString(), color: '#f4b761' },
                      { label: 'Critical APIs', value: businessImpact.criticalApis || 0, color: '#60a5fa' },
                      { label: 'Est. MTTR', value: `${businessImpact.estimatedMttrMinutes || 0} min`, color: '#16c7a2' },
                    ].map(({ label, value, color }) => (
                      <Grid item xs={6} key={label}>
                        <Box sx={{ p: 1.5, borderRadius: 2, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>{label}</Typography>
                          <Typography variant="h6" fontWeight={800} sx={{ color, fontSize: '1.1rem' }}>{value}</Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Typography variant="body2" color="text.disabled">Business impact calculated after investigation completes</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Timeline */}
        <Card sx={{ mb: 2.5 }}>
          <CardContent sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <TimelineIcon sx={{ color: 'secondary.main' }} />
              <Typography variant="h6" fontWeight={700}>Evidence Timeline</Typography>
            </Box>
            {results.timeline?.length === 0 ? (
              <Typography variant="body2" color="text.disabled">Timeline events will appear here as AEGIS analyzes the evidence</Typography>
            ) : (
              <Box sx={{ position: 'relative', pl: 3 }}>
                <Box sx={{ position: 'absolute', left: 11, top: 0, bottom: 0, width: 2, background: 'linear-gradient(180deg, #16c7a2, rgba(22,199,162,0.1))' }} />
                {results.timeline.map((event, i) => (
                  <motion.div key={event.id || i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                    <Box sx={{ display: 'flex', gap: 2, mb: 2, position: 'relative' }}>
                      <Box sx={{
                        position: 'absolute', left: -23, top: 4,
                        width: 10, height: 10, borderRadius: '50%',
                        background: '#f4b761', boxShadow: '0 0 10px rgba(244,183,97,0.5)',
                        border: '2px solid rgba(7,16,20,1)'
                      }} />
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.3 }}>
                          <Typography variant="body2" fontWeight={700}>{event.label}</Typography>
                          <Chip label={`${event.confidence || 0}%`} size="small"
                            sx={{ height: 18, fontSize: '0.65rem', background: 'rgba(22,199,162,0.12)', color: 'primary.main', fontWeight: 700 }} />
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.82rem' }}>{event.description}</Typography>
                        {event.occurred_at && (
                          <Typography variant="caption" color="text.disabled">
                            {new Date(event.occurred_at).toLocaleTimeString()} UTC
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </motion.div>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>

        <Grid container spacing={2.5}>
          {/* Evidence & Integrations */}
          <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <IntegrationsHub investigationId={id} />

            <Card sx={{ flex: 1 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Evidence Files</Typography>
                {results.evidence?.length === 0 ? (
                  <Typography variant="body2" color="text.disabled">Click "Load Demo Evidence" to add evidence files</Typography>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, maxHeight: 400, overflowY: 'auto', pr: 1 }}>
                    {results.evidence.map(ev => (
                      <Box key={ev.id} sx={{ display: 'flex', alignItems: 'center', p: 1.5, borderRadius: 1.5, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <Typography sx={{ fontSize: '1.4rem', mr: 1.5 }}>{CLASSIFICATION_ICONS[ev.classification] || '❓'}</Typography>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body2" fontWeight={600} noWrap title={ev.filename}>{ev.filename}</Typography>
                          <Box sx={{ display: 'flex', gap: 1, mt: 0.2, alignItems: 'center' }}>
                            <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600, fontSize: '0.65rem', textTransform: 'uppercase' }}>
                              {ev.classification?.replace('_', ' ') || 'UNCLASSIFIED'}
                            </Typography>
                            {ev.char_count > 0 && (
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                                • {(ev.char_count / 1024).toFixed(1)} KB text
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Recommendations */}
          <Grid item xs={12} md={8}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Recommendations</Typography>
                {results.recommendations?.length === 0 ? (
                  <Typography variant="body2" color="text.disabled">Recommendations will be generated after investigation completes</Typography>
                ) : (
                  <Box sx={{ display: 'grid', gap: 1.2 }}>
                    {results.recommendations.map(rec => (
                      <Box key={rec.id} sx={{ p: 1.5, borderRadius: 2, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                        <Chip label={rec.priority} size="small"
                          sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800, flexShrink: 0, mt: 0.2,
                            background: alpha(SEV_COLORS[rec.priority] || '#fff', 0.15), color: SEV_COLORS[rec.priority] }} />
                        <Box>
                          <Typography variant="body2" fontWeight={700} sx={{ mb: 0.3 }}>{rec.title}</Typography>
                          <Typography variant="caption" color="text.secondary">{rec.description}</Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </AppShell>
  );
}
