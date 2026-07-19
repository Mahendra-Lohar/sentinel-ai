import React, { useState } from 'react';
import { Box, Card, Typography, Button, Snackbar, Alert, CircularProgress } from '@mui/material';
import { Slack, Trello, BellRing } from 'lucide-react';
import { dispatchIntegration } from '../services/api';

export default function IntegrationsHub({ investigationId }) {
  const [loading, setLoading] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handleDispatch = async (target) => {
    setLoading(target);
    try {
      const response = await dispatchIntegration(investigationId, target);
      setSnackbar({
        open: true,
        message: `${response.provider} Sync: ${response.message}`,
        severity: 'success'
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: `Integration failed: ${err.response?.data?.error || err.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <Card sx={{ p: 2, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
      <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block', mb: 1.5 }}>
        External Integrations
      </Typography>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Button 
          variant="outlined" 
          fullWidth
          disabled={!!loading}
          onClick={() => handleDispatch('slack')}
          startIcon={loading === 'slack' ? <CircularProgress size={16} /> : <Slack size={18} />}
          sx={{ 
            justifyContent: 'flex-start', color: '#E01E5A', borderColor: 'rgba(224,30,90,0.3)',
            '&:hover': { borderColor: '#E01E5A', background: 'rgba(224,30,90,0.05)' }
          }}
        >
          Notify Slack #incidents
        </Button>
        
        <Button 
          variant="outlined" 
          fullWidth
          disabled={!!loading}
          onClick={() => handleDispatch('jira')}
          startIcon={loading === 'jira' ? <CircularProgress size={16} /> : <Trello size={18} />}
          sx={{ 
            justifyContent: 'flex-start', color: '#0052CC', borderColor: 'rgba(0,82,204,0.3)',
            '&:hover': { borderColor: '#0052CC', background: 'rgba(0,82,204,0.05)' }
          }}
        >
          Create Jira Bug Ticket
        </Button>

        <Button 
          variant="outlined" 
          fullWidth
          disabled={!!loading}
          onClick={() => handleDispatch('pagerduty')}
          startIcon={loading === 'pagerduty' ? <CircularProgress size={16} /> : <BellRing size={18} />}
          sx={{ 
            justifyContent: 'flex-start', color: '#06AC38', borderColor: 'rgba(6,172,56,0.3)',
            '&:hover': { borderColor: '#06AC38', background: 'rgba(6,172,56,0.05)' }
          }}
        >
          Resolve PagerDuty Alert
        </Button>
      </Box>

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={4000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%', background: 'rgba(20,20,20,0.9)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Card>
  );
}
