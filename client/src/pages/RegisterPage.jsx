import React, { useState } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, Button, Alert,
  InputAdornment, IconButton, Divider
} from '@mui/material';
import { Visibility, VisibilityOff, Shield, ArrowForward } from '@mui/icons-material';
import { useNavigate, Link } from 'react-router-dom';
import { register as registerApi } from '../services/api.js';
import { useAuth } from '../state/AuthContext.jsx';
import { motion } from 'framer-motion';

export function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setError('');
    setLoading(true);
    try {
      const data = await registerApi(form);
      login(data.token, data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box sx={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2,
      background: 'radial-gradient(circle at 20% 20%, rgba(22,199,162,0.15), transparent 40%), radial-gradient(circle at 80% 80%, rgba(244,183,97,0.1), transparent 40%)',
    }}>
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Box sx={{ width: 'min(420px, 100%)' }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box sx={{
              width: 56, height: 56, borderRadius: '16px', mx: 'auto', mb: 2,
              background: 'linear-gradient(135deg, #16c7a2, #0e6655)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 40px rgba(22,199,162,0.4)',
            }}>
              <Shield sx={{ fontSize: 28, color: '#031411' }} />
            </Box>
            <Typography variant="h5" fontWeight={900} sx={{ mb: 0.5 }}>Create account</Typography>
            <Typography variant="body2" color="text.secondary">Join Sentinel AI</Typography>
          </Box>

          <Card>
            <CardContent sx={{ p: 3.5 }}>
              {error && <Alert severity="error" sx={{ mb: 2.5 }}>{error}</Alert>}
              <form onSubmit={handleSubmit}>
                <TextField fullWidth label="Full name" required value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} sx={{ mb: 2 }} />
                <TextField fullWidth label="Email address" type="email" required value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))} sx={{ mb: 2 }} />
                <TextField fullWidth label="Password (min 8 chars)" required
                  type={showPass ? 'text' : 'password'} value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  InputProps={{ endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setShowPass(s => !s)}>
                        {showPass ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )}} sx={{ mb: 3 }} />
                <Button type="submit" fullWidth variant="contained" size="large"
                  disabled={loading} endIcon={<ArrowForward />} sx={{ py: 1.4 }}>
                  {loading ? 'Creating account…' : 'Create Account'}
                </Button>
              </form>
              <Divider sx={{ my: 2.5 }}><Typography variant="caption" color="text.secondary">or</Typography></Divider>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Already have an account?{' '}
                  <Link to="/login" style={{ color: '#16c7a2', fontWeight: 700 }}>Sign in</Link>
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </motion.div>
    </Box>
  );
}
