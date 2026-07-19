import { createTheme, alpha } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#16c7a2',
      light: '#4dd8b8',
      dark: '#0e9077',
      contrastText: '#031411',
    },
    secondary: {
      main: '#f4b761',
      light: '#f7c884',
      dark: '#c8903a',
      contrastText: '#1a0f00',
    },
    error: { main: '#ff6b6b', light: '#ff9999', dark: '#cc3333' },
    warning: { main: '#f4b761' },
    info: { main: '#60a5fa' },
    success: { main: '#16c7a2' },
    background: {
      default: '#071014',
      paper: 'rgba(12, 30, 35, 0.85)',
    },
    text: {
      primary: '#eff7f5',
      secondary: '#a9c7c1',
      disabled: '#4a6a66',
    },
    divider: 'rgba(255, 255, 255, 0.08)',
  },
  typography: {
    fontFamily: '"Inter", "ui-sans-serif", "system-ui", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h1: { fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1 },
    h2: { fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.15 },
    h3: { fontWeight: 700, letterSpacing: '-0.015em' },
    h4: { fontWeight: 700, letterSpacing: '-0.01em' },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    subtitle1: { color: '#a9c7c1' },
    subtitle2: { color: '#a9c7c1', fontWeight: 500 },
    body1: { lineHeight: 1.7 },
    body2: { color: '#a9c7c1', lineHeight: 1.6 },
    caption: { color: '#6a9490', fontSize: '0.75rem' },
    overline: { color: '#16c7a2', fontWeight: 800, letterSpacing: '0.12em', fontSize: '0.72rem' },
    button: { fontWeight: 700, letterSpacing: '0.01em' },
  },
  shape: { borderRadius: 10 },
  spacing: 8,
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: 'radial-gradient(circle at 10% 10%, rgba(25, 136, 132, 0.18), transparent 30rem), radial-gradient(circle at 85% 5%, rgba(174, 120, 54, 0.14), transparent 25rem), #071014',
          minHeight: '100vh',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(22, 199, 162, 0.3) transparent',
          '&::-webkit-scrollbar': { width: 6 },
          '&::-webkit-scrollbar-thumb': { background: 'rgba(22, 199, 162, 0.3)', borderRadius: 3 },
        },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          background: 'rgba(12, 30, 35, 0.82)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          background: 'rgba(12, 30, 35, 0.82)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(20px)',
          transition: 'all 0.2s ease',
          '&:hover': {
            border: '1px solid rgba(22, 199, 162, 0.25)',
            boxShadow: '0 8px 40px rgba(22, 199, 162, 0.08)',
          },
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 8, textTransform: 'none', fontWeight: 700 },
        containedPrimary: {
          background: 'linear-gradient(135deg, #16c7a2, #0e9077)',
          color: '#031411',
          '&:hover': { background: 'linear-gradient(135deg, #4dd8b8, #16c7a2)' },
        },
        outlined: {
          borderColor: 'rgba(255, 255, 255, 0.15)',
          color: '#eff7f5',
          '&:hover': { borderColor: '#16c7a2', background: 'rgba(22, 199, 162, 0.08)' },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            background: 'rgba(255, 255, 255, 0.04)',
            '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.12)' },
            '&:hover fieldset': { borderColor: 'rgba(22, 199, 162, 0.4)' },
            '&.Mui-focused fieldset': { borderColor: '#16c7a2' },
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: { background: 'rgba(255, 255, 255, 0.04)' },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, fontSize: '0.76rem' },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          background: 'rgba(12, 30, 35, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          backdropFilter: 'blur(12px)',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 10 },
        standardSuccess: { background: 'rgba(22, 199, 162, 0.12)', border: '1px solid rgba(22, 199, 162, 0.25)' },
        standardError: { background: 'rgba(255, 107, 107, 0.12)', border: '1px solid rgba(255, 107, 107, 0.25)' },
        standardWarning: { background: 'rgba(244, 183, 97, 0.12)', border: '1px solid rgba(244, 183, 97, 0.25)' },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: { borderColor: 'rgba(255, 255, 255, 0.07)' },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          '&.Mui-selected': {
            background: 'rgba(22, 199, 162, 0.12)',
            '&:hover': { background: 'rgba(22, 199, 162, 0.18)' },
          },
          '&:hover': { background: 'rgba(255, 255, 255, 0.06)' },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderColor: 'rgba(255, 255, 255, 0.06)' },
        head: { fontWeight: 700, color: '#a9c7c1', background: 'rgba(0,0,0,0.2)' },
      },
    },
  },
});
