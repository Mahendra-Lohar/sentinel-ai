import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, TextField, Button, Avatar,
  Chip, IconButton, CircularProgress, Divider, alpha
} from '@mui/material';
import { Send, ArrowBack, ContentCopy, Psychology } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { AppShell } from '../components/AppShell.jsx';
import { getChatHistory, sendChatMessage, getInvestigation } from '../services/api.js';
import { useAuth } from '../state/AuthContext.jsx';

const QUICK_PROMPTS = [
  'Explain for CTO',
  'Explain for Junior Engineer',
  'Generate Slack update',
  'Generate Jira ticket',
  'Generate GitHub issue',
  'What is the business impact?',
];

function ChatMessage({ msg }) {
  const isUser = msg.role === 'user';
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexDirection: isUser ? 'row-reverse' : 'row', alignItems: 'flex-start' }}>
        <Avatar sx={{
          width: 32, height: 32, flexShrink: 0,
          background: isUser ? 'rgba(22,199,162,0.2)' : 'linear-gradient(135deg, #16c7a2, #0e6655)',
          fontSize: '0.75rem', fontWeight: 700, color: isUser ? '#16c7a2' : '#031411'
        }}>
          {isUser ? 'U' : 'AI'}
        </Avatar>
        <Box sx={{ maxWidth: '80%', flex: 1 }}>
          <Box sx={{
            p: 1.8, borderRadius: isUser ? '12px 4px 12px 12px' : '4px 12px 12px 12px',
            background: isUser ? 'rgba(22,199,162,0.1)' : 'rgba(255,255,255,0.05)',
            border: isUser ? '1px solid rgba(22,199,162,0.2)' : '1px solid rgba(255,255,255,0.07)',
          }}>
            {isUser ? (
              <Typography variant="body2">{msg.content}</Typography>
            ) : (
              <Box sx={{
                '& p': { margin: '0 0 8px', fontSize: '0.88rem', color: '#eff7f5', lineHeight: 1.65 },
                '& h2, & h3': { color: '#eff7f5', fontWeight: 700, mt: 1.5, mb: 0.5, fontSize: '0.95rem' },
                '& ul, & ol': { pl: 2.5, mb: 1, fontSize: '0.88rem' },
                '& li': { mb: 0.3, color: '#a9c7c1' },
                '& strong': { color: '#eff7f5', fontWeight: 700 },
                '& table': { width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', mb: 1 },
                '& th': { background: 'rgba(255,255,255,0.08)', p: '4px 8px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)' },
                '& td': { p: '4px 8px', borderBottom: '1px solid rgba(255,255,255,0.06)' },
                '& code': { background: 'rgba(255,255,255,0.08)', px: 0.8, py: 0.2, borderRadius: 1, fontSize: '0.82rem', fontFamily: 'monospace' },
              }}>
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </Box>
            )}
          </Box>
          {!isUser && (
            <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, justifyContent: 'flex-start' }}>
              <IconButton size="small" onClick={copy} sx={{ color: 'text.disabled', fontSize: '0.72rem', gap: 0.3 }}>
                <ContentCopy sx={{ fontSize: 14 }} />
                <Typography variant="caption" sx={{ fontSize: '0.68rem' }}>{copied ? 'Copied!' : 'Copy'}</Typography>
              </IconButton>
            </Box>
          )}
        </Box>
      </Box>
    </motion.div>
  );
}

export function AIChatPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [investigation, setInvestigation] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    getInvestigation(id).then(d => setInvestigation(d.investigation));
    getChatHistory(id).then(setMessages);
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send(text) {
    const msg = (text || input).trim();
    if (!msg) return;
    setInput('');
    setSending(true);
    const optimistic = { id: Date.now(), role: 'user', content: msg };
    setMessages(m => [...m, optimistic]);
    try {
      const { assistantMessage } = await sendChatMessage(id, msg);
      setMessages(m => [...m, assistantMessage]);
    } catch {
      setMessages(m => m.filter(x => x.id !== optimistic.id));
    } finally {
      setSending(false);
    }
  }

  return (
    <AppShell>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 72px)' }}>
        {/* Header */}
        <Box sx={{ p: 2.5, borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton size="small" onClick={() => navigate(`/investigations/${id}`)}>
            <ArrowBack />
          </IconButton>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ width: 36, height: 36, borderRadius: 2, background: 'linear-gradient(135deg, #16c7a2, #0e6655)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Psychology sx={{ fontSize: 20, color: '#031411' }} />
            </Box>
            <Box>
              <Typography variant="body1" fontWeight={700}>AEGIS Chat</Typography>
              <Typography variant="caption" color="text.secondary">
                {investigation?.title || 'AI Investigation Assistant'}
              </Typography>
            </Box>
          </Box>
          <Chip label="AI_MODE: demo" size="small"
            sx={{ ml: 'auto', background: 'rgba(22,199,162,0.1)', color: 'primary.main', fontWeight: 700, fontSize: '0.7rem' }} />
        </Box>

        {/* Quick prompts */}
        <Box sx={{ px: 2.5, py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 0.8, flexWrap: 'wrap' }}>
          {QUICK_PROMPTS.map(p => (
            <Chip key={p} label={p} size="small" clickable onClick={() => send(p)}
              sx={{ background: 'rgba(255,255,255,0.06)', '&:hover': { background: 'rgba(22,199,162,0.12)', color: 'primary.main' }, cursor: 'pointer', fontSize: '0.75rem' }} />
          ))}
        </Box>

        {/* Messages */}
        <Box sx={{ flex: 1, overflowY: 'auto', p: 2.5 }}>
          {messages.length === 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 2 }}>
              <Box sx={{ width: 64, height: 64, borderRadius: '20px', background: 'linear-gradient(135deg, #16c7a2, #0e6655)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Psychology sx={{ fontSize: 32, color: '#031411' }} />
              </Box>
              <Typography variant="h6" fontWeight={700}>Ask AEGIS anything</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', maxWidth: 380 }}>
                I have full context of this investigation. Ask me to explain findings, generate incident reports, Slack updates, Jira tickets, or GitHub issues.
              </Typography>
            </Box>
          ) : (
            <AnimatePresence>
              {messages.map(msg => <ChatMessage key={msg.id} msg={msg} />)}
            </AnimatePresence>
          )}
          {sending && (
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mb: 2 }}>
              <Avatar sx={{ width: 32, height: 32, background: 'linear-gradient(135deg, #16c7a2, #0e6655)', fontSize: '0.75rem', fontWeight: 700, color: '#031411' }}>AI</Avatar>
              <Box sx={{ p: 1.5, borderRadius: '4px 12px 12px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: 0.5, alignItems: 'center' }}>
                <CircularProgress size={14} sx={{ color: 'primary.main' }} />
                <Typography variant="caption" color="text.secondary">AEGIS is thinking…</Typography>
              </Box>
            </Box>
          )}
          <div ref={messagesEndRef} />
        </Box>

        {/* Input */}
        <Box sx={{ p: 2.5, borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: 1.5 }}>
          <TextField
            fullWidth size="small"
            placeholder="Ask AEGIS about this investigation…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            multiline
            maxRows={3}
          />
          <Button variant="contained" onClick={() => send()} disabled={!input.trim() || sending} sx={{ px: 2, minWidth: 52 }}>
            <Send sx={{ fontSize: 20 }} />
          </Button>
        </Box>
      </Box>
    </AppShell>
  );
}
