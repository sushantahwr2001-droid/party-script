import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "dark",

    background: {
      default: "#020617", // deep navy
      paper: "rgba(15, 23, 42, 0.6)", // glass base
    },

    primary: {
      main: "#6366F1", // indigo (Stripe-ish)
    },

    secondary: {
      main: "#22C55E", // green (success feel)
    },

    text: {
      primary: "#E2E8F0",
      secondary: "#94A3B8",
    },

    divider: "rgba(148, 163, 184, 0.15)",
  },

  typography: {
    fontFamily: "Inter, sans-serif",

    h4: {
      fontWeight: 600,
      fontSize: "1.5rem",
      letterSpacing: "-0.02em",
    },

    h5: {
      fontWeight: 600,
      fontSize: "1.25rem",
    },

    h6: {
      fontWeight: 500,
      fontSize: "1rem",
    },

    body1: {
      fontSize: "0.95rem",
    },

    body2: {
      fontSize: "0.85rem",
      color: "#94A3B8",
    },

    caption: {
      fontSize: "0.75rem",
      color: "#64748B",
    },
  },

  shape: {
    borderRadius: 14, // smooth SaaS corners
  },

  spacing: 8,

  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          background: "rgba(15, 23, 42, 0.6)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(148, 163, 184, 0.1)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
          transition: "all 0.25s ease",

          "&:hover": {
            transform: "translateY(-4px)",
            boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
          },
        },
      },
    },

    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          textTransform: "none",
          fontWeight: 500,
          padding: "8px 16px",
        },

        containedPrimary: {
          background: "linear-gradient(135deg, #6366F1, #4F46E5)",
        },
      },
    },

    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontSize: "0.75rem",
        },
      },
    },

    MuiLinearProgress: {
      styleOverrides: {
        root: {
          height: 6,
          borderRadius: 10,
          backgroundColor: "rgba(148, 163, 184, 0.1)",
        },
        bar: {
          borderRadius: 10,
        },
      },
    },
  },
});

export default theme;