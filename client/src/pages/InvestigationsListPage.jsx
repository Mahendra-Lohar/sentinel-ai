import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Button, TextField, InputAdornment,
  Select, MenuItem, FormControl, InputLabel, Chip, Table, TableBody,
  TableCell, TableHead, TableRow, IconButton, Skeleton, alpha, Tooltip
} from '@mui/material';
import { Add, Search, Delete, Launch, FilterList } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { AppShell } from '../components/AppShell.jsx';
import { listInvestigations, deleteInvestigation } from '../services/api.js';

const SEV_COLORS = { P0: '#ff6b6b', P1: '#f4b761', P2: '#60a5fa', P3: '#a9c7c1' };
const STATUS_COLORS = { draft: '#a9c7c1', investigating: '#f4b761', resolved: '#16c7a2', failed: '#ff6b6b' };

export function InvestigationsListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [severity, setSeverity] = useState('');
  const [status, setStatus] = useState('');

  const { data: investigations = [], isLoading } = useQuery({
    queryKey: ['investigations', { search, severity, status }],
    queryFn: () => listInvestigations({ search: search || undefined, severity: severity || undefined, status: status || undefined }),
    refetchInterval: 10000
  });

  const deleteMut = useMutation({
    mutationFn: deleteInvestigation,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['investigations'] })
  });

  return (
    <AppShell>
      <Box sx={{ p: 3, maxWidth: 1300, mx: 'auto' }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 4 }}>
          <Box>
            <Typography variant="overline" sx={{ color: 'primary.main', display: 'block', mb: 0.5 }}>Investigation Registry</Typography>
            <Typography variant="h4" fontWeight={900}>All Investigations</Typography>
            <Typography variant="body2" color="text.secondary">{investigations.length} total investigations</Typography>
          </Box>
          <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/investigations/new')}>
            New Investigation
          </Button>
        </Box>

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <FilterList sx={{ color: 'text.secondary' }} />
            <TextField
              size="small" placeholder="Search investigations…" value={search}
              onChange={e => setSearch(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment> }}
              sx={{ minWidth: 260 }}
            />
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Severity</InputLabel>
              <Select value={severity} label="Severity" onChange={e => setSeverity(e.target.value)}>
                <MenuItem value="">All</MenuItem>
                {['P0','P1','P2','P3'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Status</InputLabel>
              <Select value={status} label="Status" onChange={e => setStatus(e.target.value)}>
                <MenuItem value="">All</MenuItem>
                {['draft','investigating','resolved','failed'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </Select>
            </FormControl>
            {(search || severity || status) && (
              <Button size="small" variant="text" onClick={() => { setSearch(''); setSeverity(''); setStatus(''); }}>
                Clear filters
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent sx={{ p: 0 }}>
            {isLoading ? (
              <Box sx={{ p: 2.5, display: 'grid', gap: 1 }}>
                {[1,2,3,4].map(i => <Skeleton key={i} variant="rectangular" height={60} sx={{ borderRadius: 1 }} />)}
              </Box>
            ) : investigations.length === 0 ? (
              <Box sx={{ py: 8, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>No investigations found</Typography>
                <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/investigations/new')}>
                  Create First Investigation
                </Button>
              </Box>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Investigation</TableCell>
                    <TableCell align="center">Severity</TableCell>
                    <TableCell align="center">Status</TableCell>
                    <TableCell align="center">Confidence</TableCell>
                    <TableCell align="right">Created</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <AnimatePresence>
                    {investigations.map((inv, i) => (
                      <motion.tr key={inv.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: i * 0.03 }}
                        style={{ cursor: 'pointer' }}
                        component="tr"
                      >
                        <TableCell onClick={() => navigate(`/investigations/${inv.id}`)}>
                          <Typography variant="body2" fontWeight={600}>{inv.title}</Typography>
                          {inv.description && (
                            <Typography variant="caption" color="text.secondary">
                              {inv.description.slice(0, 70)}{inv.description.length > 70 ? '…' : ''}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <Chip label={inv.severity} size="small" sx={{ background: alpha(SEV_COLORS[inv.severity]||'#fff',0.15), color: SEV_COLORS[inv.severity], fontWeight: 800 }} />
                        </TableCell>
                        <TableCell align="center">
                          <Chip label={inv.status} size="small" sx={{ background: alpha(STATUS_COLORS[inv.status]||'#fff',0.12), color: STATUS_COLORS[inv.status], fontWeight: 600 }} />
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" fontWeight={700} sx={{ color: inv.confidence > 0 ? 'primary.main' : 'text.disabled' }}>
                            {inv.confidence > 0 ? `${inv.confidence}%` : '—'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="caption" color="text.secondary">
                            {new Date(inv.created_at).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Open Investigation">
                            <IconButton size="small" onClick={() => navigate(`/investigations/${inv.id}`)}>
                              <Launch sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); deleteMut.mutate(inv.id); }}>
                              <Delete sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </Box>
    </AppShell>
  );
}
