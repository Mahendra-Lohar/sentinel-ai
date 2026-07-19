import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Box, Card, CardContent, Typography, TextField, Button, Alert,
  Select, MenuItem, FormControl, InputLabel, Stepper, Step, StepLabel,
  Grid, Chip, alpha, LinearProgress
} from '@mui/material';
import { ArrowForward, ArrowBack, Rocket, CloudUpload, FolderOpen } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { AppShell } from '../components/AppShell.jsx';
import { createInvestigation, uploadEvidence, loadDemoEvidence, listDemoPacks } from '../services/api.js';

const STEPS = ['Details', 'Upload Evidence', 'Launch'];
const SEV_COLORS = { P0: '#ff6b6b', P1: '#f4b761', P2: '#60a5fa', P3: '#a9c7c1' };
const CAT_COLORS = { Cache: '#16c7a2', Database: '#60a5fa', Payments: '#f4b761', Network: '#a9c7c1', Security: '#ff6b6b' };

const CLASSIFICATION_ICONS = {
  application_log: '📋',
  system_log: '🖥️',
  metrics: '📊',
  screenshot: '🖼️',
  git_commit: '🌿',
  deployment: '🚀',
  runbook: '📚',
  documentation: '📄',
  support_ticket: '🎫',
  database_report: '🗄️',
  general_document: '📝',
};

export function NewInvestigationPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ title: '', description: '', severity: 'P1' });
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [parsedEvidence, setParsedEvidence] = useState([]);
  const [selectedDemoPack, setSelectedDemoPack] = useState(null);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [investigationId, setInvestigationId] = useState(null);

  const { data: demoPacksData } = useQuery({ queryKey: ['demo-packs'], queryFn: listDemoPacks });
  const demoPacks = demoPacksData?.demoPacks || [];

  const createMut = useMutation({
    mutationFn: () => createInvestigation({ ...form }),
    onSuccess: (inv) => { setInvestigationId(inv.id); setStep(1); },
    onError: (err) => setError(err.response?.data?.error || 'Failed to create investigation')
  });

  const handleFileChange = useCallback((e) => {
    const files = Array.from(e.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
    setSelectedDemoPack(null); // Clear demo pack if manual upload
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
    setSelectedDemoPack(null);
  }, []);

  const removeFile = (index) => setUploadedFiles(f => f.filter((_, i) => i !== index));

  async function handleUploadAndNext() {
    setError('');
    setUploading(true);
    try {
      if (selectedDemoPack) {
        // Load demo evidence pack as real files
        const result = await loadDemoEvidence(investigationId, selectedDemoPack);
        setParsedEvidence(result.evidence || []);
      } else if (uploadedFiles.length > 0) {
        const formData = new FormData();
        for (const file of uploadedFiles) formData.append('files', file);
        const result = await uploadEvidence(investigationId, formData);
        setParsedEvidence(result.evidence || []);
      }
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  function handleNext() {
    setError('');
    if (step === 0) {
      if (!form.title.trim()) { setError('Investigation title is required'); return; }
      createMut.mutate();
    } else if (step === 1) {
      if (!uploadedFiles.length && !selectedDemoPack) {
        setError('Please upload evidence files or choose a demo pack to continue');
        return;
      }
      handleUploadAndNext();
    } else {
      navigate(`/investigations/${investigationId}`);
    }
  }

  return (
    <AppShell>
      <Box sx={{ p: 3, maxWidth: 900, mx: 'auto' }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="overline" sx={{ color: 'primary.main', display: 'block', mb: 0.5 }}>AEGIS Investigation Engine</Typography>
          <Typography variant="h4" fontWeight={900}>New Investigation</Typography>
          <Typography variant="body2" color="text.secondary">
            Upload any evidence — logs, metrics, screenshots, git history — and let AEGIS investigate.
          </Typography>
        </Box>

        <Stepper activeStep={step} sx={{ mb: 4 }}>
          {STEPS.map(label => (
            <Step key={label}>
              <StepLabel sx={{
                '& .MuiStepLabel-label': { fontWeight: 600, color: 'text.secondary' },
                '& .MuiStepLabel-label.Mui-active': { color: 'primary.main' },
                '& .MuiStepIcon-root.Mui-active': { color: 'primary.main' },
                '& .MuiStepIcon-root.Mui-completed': { color: 'primary.main' },
              }}>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        <motion.div key={step} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }}>
          {/* Step 0: Details */}
          {step === 0 && (
            <Card>
              <CardContent sx={{ p: 3.5 }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>Investigation Details</Typography>
                <TextField fullWidth label="Incident Title" required value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Checkout API — HTTP 500 errors after deployment"
                  sx={{ mb: 2.5 }} />
                <TextField fullWidth multiline rows={3} label="Description (optional)" value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Briefly describe the incident symptoms and when it was first observed…"
                  sx={{ mb: 2.5 }} />
                <FormControl fullWidth>
                  <InputLabel>Severity</InputLabel>
                  <Select value={form.severity} label="Severity" onChange={e => setForm(f => ({ ...f, severity: e.target.value }))}>
                    {[
                      { val: 'P0', label: 'P0 — Critical (system down)' },
                      { val: 'P1', label: 'P1 — High (major impact)' },
                      { val: 'P2', label: 'P2 — Medium (partial impact)' },
                      { val: 'P3', label: 'P3 — Low (minor impact)' },
                    ].map(s => <MenuItem key={s.val} value={s.val}>{s.label}</MenuItem>)}
                  </Select>
                </FormControl>
              </CardContent>
            </Card>
          )}

          {/* Step 1: Evidence Upload */}
          {step === 1 && (
            <Box>
              {/* Drag & Drop Zone */}
              <Card sx={{ mb: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>Upload Evidence Files</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                    Drag & drop any evidence: <strong>.log, .txt, .json, .csv, .xml, .md, .png, .jpg, .zip</strong>
                    — AEGIS will automatically classify and investigate each file.
                  </Typography>

                  <Box
                    onDragOver={e => e.preventDefault()}
                    onDrop={handleDrop}
                    sx={{
                      border: '2px dashed rgba(22,199,162,0.3)',
                      borderRadius: 3, p: 4,
                      textAlign: 'center',
                      background: 'rgba(22,199,162,0.04)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': { border: '2px dashed rgba(22,199,162,0.7)', background: 'rgba(22,199,162,0.08)' }
                    }}
                    onClick={() => document.getElementById('file-input').click()}
                  >
                    <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 1, opacity: 0.7 }} />
                    <Typography variant="body1" fontWeight={600} sx={{ mb: 0.5 }}>
                      Drop files here or click to browse
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Logs • Metrics • Screenshots • Git history • Runbooks • Support tickets
                    </Typography>
                    <input
                      id="file-input" type="file" multiple style={{ display: 'none' }}
                      accept=".log,.txt,.json,.csv,.xml,.md,.markdown,.png,.jpg,.jpeg,.gif,.webp,.zip,.yaml,.yml"
                      onChange={handleFileChange}
                    />
                  </Box>

                  {uploadedFiles.length > 0 && (
                    <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                      {uploadedFiles.map((file, i) => (
                        <Chip key={i} label={file.name} size="small" onDelete={() => removeFile(i)}
                          sx={{ background: 'rgba(22,199,162,0.1)', color: '#eff7f5', border: '1px solid rgba(22,199,162,0.2)' }} />
                      ))}
                    </Box>
                  )}
                </CardContent>
              </Card>

              {/* OR: Demo Packs */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2.5 }}>
                <Box sx={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
                <Typography variant="caption" color="text.secondary" sx={{ px: 1 }}>or load a demo evidence pack</Typography>
                <Box sx={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
              </Box>

              <Grid container spacing={1.5}>
                {demoPacks.map(pack => (
                  <Grid item xs={12} sm={6} key={pack.id}>
                    <Card
                      onClick={() => { setSelectedDemoPack(pack.id); setUploadedFiles([]); }}
                      sx={{
                        cursor: 'pointer',
                        border: selectedDemoPack === pack.id
                          ? '1px solid rgba(22,199,162,0.5)'
                          : '1px solid rgba(255,255,255,0.07)',
                        background: selectedDemoPack === pack.id ? 'rgba(22,199,162,0.06)' : undefined,
                        transition: 'all 0.2s',
                      }}
                    >
                      <CardContent sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.8 }}>
                          <Chip label={pack.severity} size="small"
                            sx={{ background: alpha(SEV_COLORS[pack.severity] || '#fff', 0.15), color: SEV_COLORS[pack.severity], fontWeight: 800, fontSize: '0.7rem' }} />
                          <Chip label={pack.category} size="small"
                            sx={{ background: alpha(CAT_COLORS[pack.category] || '#fff', 0.12), color: CAT_COLORS[pack.category] || '#a9c7c1', fontSize: '0.68rem' }} />
                        </Box>
                        <Typography variant="body2" fontWeight={700} sx={{ mb: 0.3 }}>{pack.title}</Typography>
                        <Typography variant="caption" color="text.secondary">{pack.description}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              {uploading && (
                <Box sx={{ mt: 2.5 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Parsing and classifying evidence…
                  </Typography>
                  <LinearProgress sx={{ borderRadius: 2, '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg, #16c7a2, #4dd8b8)' } }} />
                </Box>
              )}
            </Box>
          )}

          {/* Step 2: Launch */}
          {step === 2 && (
            <Card>
              <CardContent sx={{ p: 3.5 }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>Ready to Launch AEGIS</Typography>
                <Box sx={{ display: 'grid', gap: 1.5, mb: 3 }}>
                  {[
                    { label: 'Title', value: form.title },
                    { label: 'Severity', value: form.severity },
                    { label: 'Evidence', value: parsedEvidence.length > 0 ? `${parsedEvidence.length} file(s) parsed and classified` : 'No evidence uploaded' },
                  ].map(({ label, value }) => (
                    <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', p: 1.5, borderRadius: 2, background: 'rgba(255,255,255,0.04)' }}>
                      <Typography variant="body2" color="text.secondary">{label}</Typography>
                      <Typography variant="body2" fontWeight={600}>{value}</Typography>
                    </Box>
                  ))}
                </Box>

                {parsedEvidence.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" fontWeight={600} sx={{ mb: 1.5 }}>Evidence Classified:</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                      {parsedEvidence.map(ev => (
                        <Chip
                          key={ev.id}
                          label={`${CLASSIFICATION_ICONS[ev.classification] || '📝'} ${ev.filename}`}
                          size="small"
                          sx={{ background: 'rgba(22,199,162,0.1)', color: '#eff7f5', fontSize: '0.72rem' }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}

                <Alert severity="info" sx={{ mb: 0 }}>
                  AEGIS will launch 9 specialized agents that independently analyze the uploaded evidence.
                  All findings are derived from your actual files — no pre-scripted outputs.
                </Alert>
              </CardContent>
            </Card>
          )}
        </motion.div>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button variant="outlined" startIcon={<ArrowBack />}
            onClick={() => { if (step > 0) setStep(s => s - 1); else navigate('/investigations'); }}
            disabled={createMut.isPending || uploading}>
            Back
          </Button>
          <Button
            variant="contained"
            endIcon={step === STEPS.length - 1 ? <Rocket /> : <ArrowForward />}
            onClick={handleNext}
            disabled={createMut.isPending || uploading}
          >
            {step === 0 && (createMut.isPending ? 'Creating…' : 'Continue')}
            {step === 1 && (uploading ? 'Processing evidence…' : 'Continue')}
            {step === 2 && 'Open Mission Control'}
          </Button>
        </Box>
      </Box>
    </AppShell>
  );
}
