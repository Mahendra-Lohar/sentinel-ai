import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, TextField, Button, Snackbar, Alert, CircularProgress, Divider } from '@mui/material';
import { Save, Slack, Trello } from 'lucide-react';
import { getSettings, updateSettings } from '../services/api';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    slack_webhook_url: '',
    jira_host: '',
    jira_email: '',
    jira_api_token: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await getSettings();
      setSettings(prev => ({ ...prev, ...response.settings }));
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to load settings', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings(settings);
      setSnackbar({ open: true, message: 'Settings saved securely', severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to save settings', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 10 }}><CircularProgress /></Box>;

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Typography variant="h4" fontWeight={800} sx={{ mb: 4 }}>Platform Settings</Typography>

      <Card sx={{ mb: 4, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
            <Slack size={24} color="#E01E5A" />
            <Typography variant="h6" fontWeight={700}>Slack Integration</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Configure an Incoming Webhook to dispatch AI postmortems directly to a Slack channel.
          </Typography>
          <TextField
            fullWidth
            label="Slack Webhook URL"
            name="slack_webhook_url"
            value={settings.slack_webhook_url || ''}
            onChange={handleChange}
            placeholder="https://hooks.slack.com/services/..."
            variant="outlined"
            type="password"
          />
        </CardContent>
      </Card>

      <Card sx={{ mb: 4, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
            <Trello size={24} color="#0052CC" />
            <Typography variant="h6" fontWeight={700}>Jira Configuration</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Authenticate with Jira Cloud to allow Sentinel AI to autonomously create bug tickets from root causes.
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Jira Host URL"
              name="jira_host"
              value={settings.jira_host || ''}
              onChange={handleChange}
              placeholder="https://your-domain.atlassian.net"
              variant="outlined"
            />
            <TextField
              fullWidth
              label="Jira Account Email"
              name="jira_email"
              value={settings.jira_email || ''}
              onChange={handleChange}
              placeholder="admin@yourcompany.com"
              variant="outlined"
            />
            <TextField
              fullWidth
              label="Jira API Token"
              name="jira_api_token"
              value={settings.jira_api_token || ''}
              onChange={handleChange}
              placeholder="ATATT3xFfGF..."
              variant="outlined"
              type="password"
            />
          </Box>
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button 
          variant="contained" 
          onClick={handleSave} 
          disabled={saving}
          startIcon={saving ? <CircularProgress size={16} /> : <Save size={18} />}
          sx={{ background: 'linear-gradient(90deg, #16c7a2, #4dd8b8)', color: '#000', fontWeight: 700, px: 4 }}
        >
          {saving ? 'Saving...' : 'Save Configuration'}
        </Button>
      </Box>

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={4000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
