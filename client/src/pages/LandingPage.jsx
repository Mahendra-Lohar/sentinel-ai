import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Button, Typography, Grid, Chip, Card, CardContent, Avatar, Divider, alpha
} from '@mui/material';
import {
  Shield, Psychology, BoltOutlined, Rocket, CheckCircle,
  TrendingUp, Speed, Search, Timeline, Description
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

const ROTATING_WORDS = ['Postgres', 'Redis', 'DNS', 'SSL', 'Deployments', 'Memory Leaks', 'DDoS', 'APIs'];

const FEATURES = [
  { icon: <Psychology />, title: '9 Specialized AI Agents', description: 'Log Detective, Metrics Analyst, Git Investigator, Vision Analyst, Knowledge Agent, Root Cause Agent, and more — running in parallel.' },
  { icon: <BoltOutlined />, title: 'Root Cause in Seconds', description: 'AEGIS synthesizes evidence from all agents and delivers a root cause analysis with 90%+ confidence in under 60 seconds.' },
  { icon: <TrendingUp />, title: 'Business Impact Quantification', description: 'Revenue loss per hour, affected users, critical APIs, and estimated MTTR — calculated automatically for every incident.' },
  { icon: <Timeline />, title: 'Chronological Evidence Timeline', description: 'AEGIS constructs a precise timeline of events with timestamps and confidence scores for each finding.' },
  { icon: <Description />, title: 'Auto-Generated Postmortems', description: 'Full markdown postmortem reports with root cause, timeline, agent findings, and prioritized recommendations.' },
  { icon: <Search />, title: '10 Production Incident Scenarios', description: 'Redis exhaustion, DB pool leaks, payment outages, DNS failures, SSL expiry, memory leaks, DDoS, and more.' },
];

const SCENARIOS = [
  { label: 'Redis Exhaustion', sev: 'P1', color: '#f4b761' },
  { label: 'DB Connection Leak', sev: 'P0', color: '#ff6b6b' },
  { label: 'Payment Gateway Outage', sev: 'P0', color: '#ff6b6b' },
  { label: 'DNS Failure', sev: 'P1', color: '#f4b761' },
  { label: 'SSL Expiration', sev: 'P1', color: '#f4b761' },
  { label: 'Node.js Memory Leak', sev: 'P1', color: '#f4b761' },
  { label: 'DDoS Attack', sev: 'P0', color: '#ff6b6b' },
  { label: 'Disk Full', sev: 'P1', color: '#f4b761' },
  { label: 'Third-Party API Down', sev: 'P2', color: '#60a5fa' },
  { label: 'Faulty Deployment', sev: 'P0', color: '#ff6b6b' },
];

function RotatingWord() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setIndex(i => (i + 1) % ROTATING_WORDS.length), 2200);
    return () => clearInterval(interval);
  }, []);

  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={ROTATING_WORDS[index]}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.35 }}
        style={{ color: '#16c7a2', display: 'inline-block', minWidth: '240px', textAlign: 'left' }}
      >
        {ROTATING_WORDS[index]}
      </motion.span>
    </AnimatePresence>
  );
}

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <Box sx={{ minHeight: '100vh', background: 'radial-gradient(circle at 15% 20%, rgba(22,199,162,0.18), transparent 35%), radial-gradient(circle at 85% 10%, rgba(244,183,97,0.12), transparent 30%), #071014' }}>
      {/* Nav */}
      <Box sx={{ px: { xs: 3, md: 8 }, py: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 100 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 36, height: 36, borderRadius: '10px', background: 'linear-gradient(135deg, #16c7a2, #0e6655)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(22,199,162,0.4)' }}>
            <Shield sx={{ fontSize: 20, color: '#031411' }} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 900, fontSize: '1rem', lineHeight: 1 }}>Sentinel AI</Typography>
            <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 700, fontSize: '0.62rem', letterSpacing: '0.1em' }}>AEGIS ENGINE</Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button variant="outlined" size="small" onClick={() => navigate('/login')}>Sign In</Button>
          <Button variant="contained" size="small" onClick={() => navigate('/register')}>Get Started</Button>
        </Box>
      </Box>

      {/* Hero */}
      <Box sx={{ px: { xs: 3, md: 8 }, pt: { xs: 8, md: 12 }, pb: { xs: 8, md: 10 }, maxWidth: 1100, mx: 'auto', textAlign: 'center' }}>
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <Chip
            label="Powered by AEGIS — 9 Autonomous AI Agents"
            sx={{ mb: 4, background: 'rgba(22,199,162,0.1)', color: 'primary.main', fontWeight: 700, border: '1px solid rgba(22,199,162,0.25)', fontSize: '0.8rem' }}
          />

          <Typography variant="h1" sx={{ fontWeight: 900, fontSize: { xs: '2.8rem', md: '4.5rem', lg: '5.5rem' }, lineHeight: 1.05, mb: 1, letterSpacing: '-0.04em' }}>
            Autonomous
          </Typography>
          <Typography variant="h1" sx={{ fontWeight: 900, fontSize: { xs: '2.8rem', md: '4.5rem', lg: '5.5rem' }, lineHeight: 1.05, mb: 1, letterSpacing: '-0.04em' }}>
            Engineering
          </Typography>
          <Typography variant="h1" sx={{ fontWeight: 900, fontSize: { xs: '2.8rem', md: '4.5rem', lg: '5.5rem' }, lineHeight: 1.05, mb: 3, letterSpacing: '-0.04em' }}>
            Command Center
          </Typography>

          <Typography variant="h4" sx={{ fontWeight: 400, color: 'text.secondary', fontSize: { xs: '1.1rem', md: '1.4rem' }, mb: 2 }}>
            AEGIS investigates your production incidents.
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 400, color: 'text.secondary', fontSize: { xs: '1.1rem', md: '1.4rem' }, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, flexWrap: 'wrap', mb: 6 }}>
            <span>No more war rooms for</span>
            <RotatingWord />
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap', mb: 6 }}>
            <Button variant="contained" size="large" startIcon={<Rocket />} onClick={() => navigate('/register')}
              sx={{ px: 4, py: 1.6, fontSize: '1rem', background: 'linear-gradient(135deg, #16c7a2, #0e9077)', boxShadow: '0 8px 30px rgba(22,199,162,0.35)' }}>
              Start Investigating Free
            </Button>
            <Button variant="outlined" size="large" onClick={() => navigate('/login')}
              sx={{ px: 4, py: 1.6, fontSize: '1rem', borderColor: 'rgba(255,255,255,0.25)' }}>
              Sign In
            </Button>
          </Box>

          {/* Scenario pills */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center', mb: 4 }}>
            {SCENARIOS.map(s => (
              <Chip key={s.label} label={`${s.sev} · ${s.label}`} size="small"
                sx={{ background: alpha(s.color, 0.1), color: s.color, border: `1px solid ${alpha(s.color, 0.25)}`, fontWeight: 600, fontSize: '0.72rem' }} />
            ))}
          </Box>
        </motion.div>
      </Box>

      <Divider sx={{ maxWidth: 1100, mx: 'auto', mb: 8 }} />

      {/* Features */}
      <Box sx={{ px: { xs: 3, md: 8 }, pb: 10, maxWidth: 1100, mx: 'auto' }}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="overline" sx={{ color: 'primary.main', display: 'block', mb: 1 }}>Capabilities</Typography>
          <Typography variant="h3" fontWeight={900} sx={{ mb: 1.5 }}>Built like Datadog + PagerDuty + Linear</Typography>
          <Typography variant="body1" color="text.secondary">Combined into a single AI-first operating system.</Typography>
        </Box>

        <Grid container spacing={2.5}>
          {FEATURES.map((feature, i) => (
            <Grid item xs={12} sm={6} md={4} key={feature.title}>
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08, duration: 0.4 }}>
                <Card sx={{ height: '100%', p: 0.5 }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Box sx={{ width: 44, height: 44, borderRadius: 2, background: 'rgba(22,199,162,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2, color: 'primary.main' }}>
                      {feature.icon}
                    </Box>
                    <Typography variant="body1" fontWeight={800} sx={{ mb: 1 }}>{feature.title}</Typography>
                    <Typography variant="body2" color="text.secondary">{feature.description}</Typography>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* CTA */}
      <Box sx={{ px: { xs: 3, md: 8 }, pb: 10, maxWidth: 680, mx: 'auto', textAlign: 'center' }}>
        <Card sx={{ p: 2, border: '1px solid rgba(22,199,162,0.2)', background: 'rgba(22,199,162,0.05)' }}>
          <CardContent sx={{ p: 4 }}>
            <Shield sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography variant="h4" fontWeight={900} sx={{ mb: 1.5 }}>Ready to stop war rooms?</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Let AEGIS do the investigation. Your team does the resolution.
            </Typography>
            <Button variant="contained" size="large" startIcon={<Rocket />} onClick={() => navigate('/register')}
              sx={{ px: 5, py: 1.6, fontSize: '1rem', background: 'linear-gradient(135deg, #16c7a2, #0e9077)', boxShadow: '0 8px 30px rgba(22,199,162,0.35)' }}>
              Get Started Free
            </Button>
            <Box sx={{ display: 'flex', gap: 2.5, justifyContent: 'center', mt: 3 }}>
              {['No credit card required', '10 demo scenarios', 'Open source ready'].map(t => (
                <Box key={t} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <CheckCircle sx={{ fontSize: 14, color: 'primary.main' }} />
                  <Typography variant="caption" color="text.secondary">{t}</Typography>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Footer */}
      <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.07)', py: 3, px: { xs: 3, md: 8 }, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="caption" color="text.disabled">© 2026 Sentinel AI — AEGIS Autonomous Investigation Engine</Typography>
        <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 700 }}>
          Datadog + PagerDuty + Linear × AI
        </Typography>
      </Box>
    </Box>
  );
}
