import { createTheme } from '@mui/material/styles';

/**
 * Custom MUI Theme for SocialVibe
 * Minimal, premium design system with a dark accent palette.
 */
const theme = createTheme({
  palette: {
    primary: {
      main: '#0F1419',
      light: '#536471',
      dark: '#000000',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#FF3040',
      light: '#FF6B81',
      dark: '#D1001B',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F7F8FA',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#0F1419',
      secondary: '#536471',
    },
    success: {
      main: '#00C9A7',
    },
    error: {
      main: '#FF4757',
    },
    divider: '#EFF3F4',
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h4: { fontWeight: 800, letterSpacing: '-0.5px' },
    h5: { fontWeight: 700, letterSpacing: '-0.3px' },
    h6: { fontWeight: 700 },
    subtitle1: { fontWeight: 600 },
    body1: { lineHeight: 1.55, fontSize: '0.92rem' },
    body2: { lineHeight: 1.5, fontSize: '0.85rem' },
    button: { fontWeight: 700 },
    caption: { fontSize: '0.75rem', fontWeight: 500, color: '#536471' },
  },
  shape: {
    borderRadius: 14,
  },
  components: {
    // Button overrides
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 700,
          borderRadius: 50,
          padding: '10px 24px',
          transition: 'all 0.15s ease',
          fontSize: '0.88rem',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
        outlined: {
          borderWidth: 1.5,
          '&:hover': {
            borderWidth: 1.5,
          },
        },
      },
    },
    // Card overrides
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          boxShadow: 'none',
          border: 'none',
          borderBottom: '1px solid #EFF3F4',
        },
      },
    },
    // TextField overrides
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 14,
            transition: 'box-shadow 0.2s ease',
            '&.Mui-focused': {
              boxShadow: '0 0 0 3px rgba(15, 20, 25, 0.06)',
            },
          },
        },
      },
    },
    // AppBar overrides
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          borderBottom: '1px solid #EFF3F4',
          backgroundColor: '#FFFFFF',
        },
      },
    },
    // Avatar overrides
    MuiAvatar: {
      styleOverrides: {
        root: {
          fontWeight: 700,
          fontSize: '0.9rem',
        },
      },
    },
    // Dialog overrides
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 24,
          padding: '4px',
        },
      },
    },
    // Menu overrides
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          border: '1px solid #EFF3F4',
          boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
        },
      },
    },
    // ListItemButton overrides
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          '&:hover': {
            backgroundColor: '#F7F8FA',
          },
        },
      },
    },
    // Chip overrides
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          fontSize: '0.78rem',
        },
      },
    },
    // Divider
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: '#EFF3F4',
        },
      },
    },
  },
});

export default theme;
