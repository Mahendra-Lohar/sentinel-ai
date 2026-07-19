import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Button, Chip, Divider,
  CircularProgress, Alert, Grid, alpha
} from '@mui/material';
import { ArrowBack, ContentCopy, Download, Chat as ChatIcon } from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';
import { AppShell } from '../components/AppShell.jsx';
import { getInvestigation } from '../services/api.js';

const SEV_COLORS = { P0: '#ff6b6b', P1: '#f4b761', P2: '#60a5fa', P3: '#a9c7c1' };

export function PostmortemPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [investigation, setInvestigation] = useState(null);
  const [results, setResults] = useState(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getInvestigation(id).then(data => {
      setInvestigation(data.investigation);
      setResults(data.results);
      setLoading(false);
    });
  }, [id]);

  function copyMarkdown() {
    navigator.clipboard.writeText(results?.report?.markdown || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function downloadMarkdown() {
    const blob = new Blob([results?.report?.markdown || ''], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `postmortem-${id.slice(0,8)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <AppShell><Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box></AppShell>;

  const report = results?.report;

  return (
    <AppShell>
      <Box sx={{ p: 3, maxWidth: 960, mx: 'auto' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 4, flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button variant="outlined" size="small" startIcon={<ArrowBack />} onClick={() => navigate(`/investigations/${id}`)}>
              Back
            </Button>
            <Box>
              <Typography variant="overline" sx={{ color: 'primary.main', display: 'block' }}>Incident Postmortem</Typography>
              <Typography variant="h5" fontWeight={900}>{investigation?.title}</Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button size="small" variant="outlined" startIcon={<ChatIcon />} onClick={() => navigate(`/investigations/${id}/chat`)}>
              Ask AEGIS
            </Button>
            <Button size="small" variant="outlined" startIcon={<ContentCopy />} onClick={copyMarkdown}>
              {copied ? 'Copied!' : 'Copy'}
            </Button>
            <Button size="small" variant="contained" startIcon={<Download />} onClick={downloadMarkdown}>
              Download .md
            </Button>
          </Box>
        </Box>

        {/* Meta chips */}
        <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
          <Chip label={investigation?.severity} size="small"
            sx={{ background: alpha(SEV_COLORS[investigation?.severity]||'#fff',0.15), color: SEV_COLORS[investigation?.severity], fontWeight: 800 }} />
          <Chip label={`${investigation?.confidence || 0}% confidence`} size="small"
            sx={{ background: 'rgba(22,199,162,0.12)', color: 'primary.main', fontWeight: 700 }} />
          <Chip label={`Resolved`} size="small"
            sx={{ background: 'rgba(22,199,162,0.12)', color: 'primary.main', fontWeight: 700 }} />
          <Chip label="AEGIS Generated" size="small"
            sx={{ background: 'rgba(255,255,255,0.07)', color: 'text.secondary', fontWeight: 600 }} />
        </Box>

        {!report ? (
          <Alert severity="info">
            No postmortem available. Launch the investigation first and wait for AEGIS to complete the analysis.
          </Alert>
        ) : (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <Card>
              <CardContent sx={{ p: 3.5 }}>
                <Box sx={{
                  '& h1': { fontSize: '1.5rem', fontWeight: 900, color: '#eff7f5', mb: 1.5, mt: 0 },
                  '& h2': { fontSize: '1.15rem', fontWeight: 800, color: '#eff7f5', mt: 3, mb: 1, pb: 0.5, borderBottom: '1px solid rgba(255,255,255,0.08)' },
                  '& h3': { fontSize: '1rem', fontWeight: 700, color: '#eff7f5', mt: 2, mb: 0.8 },
                  '& p': { color: '#a9c7c1', lineHeight: 1.7, fontSize: '0.9rem', mb: 1 },
                  '& ul, & ol': { color: '#a9c7c1', pl: 3, mb: 1.5, lineHeight: 1.7 },
                  '& li': { mb: 0.4, fontSize: '0.9rem' },
                  '& strong': { color: '#eff7f5', fontWeight: 700 },
                  '& table': { width: '100%', borderCollapse: 'collapse', mb: 2, fontSize: '0.88rem' },
                  '& th': { background: 'rgba(22,199,162,0.1)', p: '8px 12px', textAlign: 'left', borderBottom: '1px solid rgba(22,199,162,0.2)', color: '#eff7f5', fontWeight: 700 },
                  '& td': { p: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', color: '#a9c7c1' },
                  '& tr:hover td': { background: 'rgba(255,255,255,0.02)' },
                  '& hr': { border: 'none', borderTop: '1px solid rgba(255,255,255,0.08)', my: 3 },
                  '& code': { background: 'rgba(22,199,162,0.1)', color: '#16c7a2', px: 0.8, py: 0.2, borderRadius: 1, fontSize: '0.82rem', fontFamily: 'monospace' },
                  '& blockquote': { borderLeft: '3px solid #16c7a2', pl: 2, ml: 0, color: '#a9c7c1', fontStyle: 'italic' },
                }}>
                  <ReactMarkdown>{report.markdown}</ReactMarkdown>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </Box>
    </AppShell>
  );
}
