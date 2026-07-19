import React, { useState } from 'react';
import {
  Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  AppBar, Toolbar, Typography, Avatar, IconButton, Chip, Divider, Tooltip
} from '@mui/material';
import {
  Dashboard, Shield, Add, List as ListIcon, Chat as ChatIcon,
  LogoutOutlined, SettingsOutlined, MenuOpen, Menu
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../state/AuthContext.jsx';

const DRAWER_WIDTH = 260;

const navItems = [
  { label: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
  { label: 'Investigations', icon: <ListIcon />, path: '/investigations' },
  { label: 'New Investigation', icon: <Add />, path: '/investigations/new' },
  { label: 'Settings', icon: <SettingsOutlined />, path: '/settings' },
];

export function AppShell({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const drawerWidth = collapsed ? 72 : DRAWER_WIDTH;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', background: 'transparent' }}>
      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          transition: 'width 0.2s ease',
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            background: 'rgba(7, 16, 20, 0.92)',
            borderRight: '1px solid rgba(255,255,255,0.07)',
            backdropFilter: 'blur(20px)',
            transition: 'width 0.2s ease',
            overflow: 'hidden',
          },
        }}
      >
        {/* Brand */}
        <Box sx={{ px: collapsed ? 1.5 : 2.5, py: 2.5, display: 'flex', alignItems: 'center', gap: 1.5, minHeight: 72 }}>
          <Box sx={{
            width: 36, height: 36, borderRadius: '10px', flexShrink: 0,
            background: 'linear-gradient(135deg, #16c7a2, #0e6655)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px rgba(22,199,162,0.4)',
          }}>
            <Shield sx={{ fontSize: 20, color: '#031411' }} />
          </Box>
          {!collapsed && (
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900, fontSize: '1rem', lineHeight: 1.1 }}>
                Sentinel AI
              </Typography>
              <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: '0.1em', fontSize: '0.65rem' }}>
                AEGIS ENGINE
              </Typography>
            </Box>
          )}
        </Box>

        <Divider />

        {/* Nav */}
        <List sx={{ px: 1, py: 1.5, flex: 1 }}>
          {navItems.map((item) => {
            const active = location.pathname === item.path ||
              (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
            return (
              <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
                <Tooltip title={collapsed ? item.label : ''} placement="right">
                  <ListItemButton
                    selected={active}
                    onClick={() => navigate(item.path)}
                    sx={{ borderRadius: 2, minHeight: 44, px: collapsed ? 1.5 : 2 }}
                  >
                    <ListItemIcon sx={{ minWidth: collapsed ? 0 : 40, color: active ? 'primary.main' : 'text.secondary' }}>
                      {item.icon}
                    </ListItemIcon>
                    {!collapsed && (
                      <ListItemText
                        primary={item.label}
                        primaryTypographyProps={{ fontSize: '0.88rem', fontWeight: active ? 700 : 500, color: active ? 'primary.main' : 'text.primary' }}
                      />
                    )}
                  </ListItemButton>
                </Tooltip>
              </ListItem>
            );
          })}
        </List>

        <Divider />

        {/* User area */}
        <Box sx={{ p: 1.5 }}>
          <ListItemButton
            onClick={() => { logout(); navigate('/login'); }}
            sx={{ borderRadius: 2, px: collapsed ? 1.5 : 2 }}
          >
            <ListItemIcon sx={{ minWidth: collapsed ? 0 : 40, color: 'error.main' }}>
              <LogoutOutlined sx={{ fontSize: 20 }} />
            </ListItemIcon>
            {!collapsed && (
              <ListItemText
                primary="Sign Out"
                primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 600, color: 'error.main' }}
              />
            )}
          </ListItemButton>
        </Box>
      </Drawer>

      {/* Main content */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Topbar */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            background: 'rgba(7, 16, 20, 0.85)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <Toolbar sx={{ gap: 2 }}>
            <IconButton size="small" onClick={() => setCollapsed(c => !c)} sx={{ color: 'text.secondary' }}>
              {collapsed ? <Menu /> : <MenuOpen />}
            </IconButton>

            <Box sx={{ flex: 1 }} />

            <Chip
              label={`AEGIS v1.0`}
              size="small"
              sx={{ background: 'rgba(22,199,162,0.12)', color: 'primary.main', fontWeight: 700, fontSize: '0.7rem', border: '1px solid rgba(22,199,162,0.25)' }}
            />

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ width: 32, height: 32, background: 'rgba(22,199,162,0.2)', color: 'primary.main', fontSize: '0.8rem', fontWeight: 700 }}>
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </Avatar>
              {user?.name && (
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                  {user.name}
                </Typography>
              )}
            </Box>
          </Toolbar>
        </AppBar>

        {/* Page content */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
