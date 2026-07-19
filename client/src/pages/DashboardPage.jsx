import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Box, Grid, Card, CardContent, Typography, Button, Chip,
  Table, TableBody, TableCell, TableHead, TableRow, Paper,
  Skeleton, alpha, LinearProgress
} from '@mui/material';
import {
  Add, ShieldOutlined, CheckCircleOutlined, Speed, Psychology,
  TrendingUp, Warning, BoltOutlined
} from '@mui/icons-material';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AppShell } from '../components/AppShell.jsx';
import { getStats, listInvestigations } from '../services/api.js';
import { motion } from 'framer-motion';

const severityColors = { P0: '#ff6b6b', P1: '#f4b761', P2: '#60a5fa', P3: '#a9c7c1' };
const statusColors = { draft: '#a9c7c1', investigating: '#f4b761', resolved: '#16c7a2', failed: '#ff6b6b' };

function StatCard({ icon, label, value, sub, color = 'primary.main', loading }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Card sx={{ height: '100%' }}>
        <CardContent sx={{ p: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ p: 1, borderRadius: 2, background: alpha(color.startsWith('#') ? color : '#16c7a2', 0.12), display: 'flex' }}>
              {React.cloneElement(icon, { sx: { color, fontSize: 22 } })}
            </Box>
          </Box>
          {loading ? (
            <Skeleton variant="text" width={80} height={48} />
          ) : (
            <Typography variant="h3" sx={{ fontWeight: 900, fontSize: '2.2rem', lineHeight: 1 }}>
              {value ?? '—'}
            </Typography>
          )}
          <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>{label}</Typography>
          {sub && <Typography variant="caption" sx={{ color: color, fontWeight: 600 }}>{sub}</Typography>}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: getStats,
    refetchInterval: 30000
  });

  const { data: investigations = [], isLoading: invLoading } = useQuery({
    queryKey: ['investigations'],
    queryFn: () => listInvestigations(),
    refetchInterval: 30000
  });

  const overview = stats?.overview || {};
  const trend = stats?.trend || [];

  return (
    <AppShell>
      <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 4 }}>
          <Box>
            <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 800, display: 'block', mb: 0.5 }}>
              Command Overview
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, mb: 0.5 }}>
              Engineering Incidents
            </Typography>
            <Typography variant="body2">
              AEGIS multi-agent investigation engine — {overview.active_count || 0} agents active
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/investigations/new')}
            sx={{ px: 3, py: 1.2 }}
          >
            New Investigation
          </Button>
        </Box>

        {/* Stat Cards */}
        <Grid container spacing={2.5} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<Warning />} label="Open Incidents" value={overview.open_count} loading={statsLoading} color="#f4b761" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<CheckCircleOutlined />} label="Resolved" value={overview.resolved_count} loading={statsLoading} color="#16c7a2" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<Speed />} label="Avg MTTR" value={overview.avg_mttr ? `${overview.avg_mttr}m` : 'N/A'} loading={statsLoading} color="#60a5fa"
              sub={overview.avg_mttr ? 'minutes to resolve' : 'Run first investigation'} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<Psychology />} label="AI Confidence" value={overview.avg_confidence ? `${overview.avg_confidence}%` : 'N/A'} loading={statsLoading} color="#16c7a2"
              sub="average across investigations" />
          </Grid>
        </Grid>

        <Grid container spacing={2.5} sx={{ mb: 3 }}>
          {/* Trend Chart */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                  <TrendingUp sx={{ color: 'primary.main' }} />
                  <Typography variant="h6" fontWeight={700}>Incident Trend (30 days)</Typography>
                </Box>
                {trend.length === 0 ? (
                  <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Create investigations to see trend data
                    </Typography>
                  </Box>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={trend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="total" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#16c7a2" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#16c7a2" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="p0" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ff6b6b" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#ff6b6b" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" tick={{ fill: '#6a9490', fontSize: 11 }} tickLine={false} />
                      <YAxis tick={{ fill: '#6a9490', fontSize: 11 }} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{ background: 'rgba(12,30,35,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                        labelStyle={{ color: '#eff7f5' }}
                      />
                      <Area type="monotone" dataKey="total" stroke="#16c7a2" fill="url(#total)" strokeWidth={2} name="Total" />
                      <Area type="monotone" dataKey="p0" stroke="#ff6b6b" fill="url(#p0)" strokeWidth={2} name="P0" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Severity Distribution */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <BoltOutlined sx={{ color: 'secondary.main' }} />
                  <Typography variant="h6" fontWeight={700}>By Severity</Typography>
                </Box>
                {(stats?.severity || []).length === 0 ? (
                  <Box sx={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="body2" color="text.secondary">No data yet</Typography>
                  </Box>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={140}>
                      <PieChart>
                        <Pie data={stats.severity} dataKey="count" nameKey="severity" cx="50%" cy="50%" outerRadius={60} paddingAngle={3}>
                          {stats.severity.map((entry) => (
                            <Cell key={entry.severity} fill={severityColors[entry.severity] || '#a9c7c1'} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ background: 'rgba(12,30,35,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                      {(stats?.severity || []).map(s => (
                        <Chip key={s.severity} label={`${s.severity}: ${s.count}`} size="small"
                          sx={{ background: alpha(severityColors[s.severity] || '#fff', 0.12), color: severityColors[s.severity], fontWeight: 700 }} />
                      ))}
                    </Box>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Recent Investigations Table */}
        <Card>
          <CardContent sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
              <Typography variant="h6" fontWeight={700}>Recent Investigations</Typography>
              <Button size="small" variant="outlined" onClick={() => navigate('/investigations')}>
                View All
              </Button>
            </Box>
            {invLoading ? (
              <Box sx={{ display: 'grid', gap: 1 }}>
                {[1,2,3].map(i => <Skeleton key={i} variant="rectangular" height={52} sx={{ borderRadius: 1 }} />)}
              </Box>
            ) : investigations.length === 0 ? (
              <Box sx={{ py: 6, textAlign: 'center' }}>
                <ShieldOutlined sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">No investigations yet</Typography>
                <Typography variant="body2" color="text.disabled" sx={{ mb: 3 }}>
                  Create your first investigation to get started
                </Typography>
                <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/investigations/new')}>
                  Create Investigation
                </Button>
              </Box>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Investigation</TableCell>
                    <TableCell align="center">Severity</TableCell>
                    <TableCell align="center">Status</TableCell>
                    <TableCell align="center">Confidence</TableCell>
                    <TableCell align="right">Created</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {investigations.slice(0, 8).map((inv) => (
                    <TableRow
                      key={inv.id}
                      hover
                      sx={{ cursor: 'pointer', '&:hover td': { background: 'rgba(22,199,162,0.04)' } }}
                      onClick={() => navigate(`/investigations/${inv.id}`)}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight={600} sx={{ color: 'text.primary' }}>
                          {inv.title}
                        </Typography>
                        {inv.description && (
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                            {inv.description.slice(0, 80)}{inv.description.length > 80 ? '…' : ''}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={inv.severity} size="small"
                          sx={{ background: alpha(severityColors[inv.severity] || '#fff', 0.15), color: severityColors[inv.severity], fontWeight: 700, fontSize: '0.72rem' }} />
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={inv.status} size="small"
                          sx={{ background: alpha(statusColors[inv.status] || '#fff', 0.12), color: statusColors[inv.status], fontWeight: 600, fontSize: '0.72rem' }} />
                      </TableCell>
                      <TableCell align="center">
                        {inv.confidence > 0 ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LinearProgress variant="determinate" value={inv.confidence}
                              sx={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)',
                                '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg, #16c7a2, #4dd8b8)' } }} />
                            <Typography variant="caption" fontWeight={700} sx={{ color: 'primary.main', minWidth: 32 }}>
                              {inv.confidence}%
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="caption" color="text.disabled">—</Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="caption" color="text.secondary">
                          {new Date(inv.created_at).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </Box>
    </AppShell>
  );
}
