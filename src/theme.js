import { alpha, createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#5f6fff",
      light: "#8ea0ff",
      dark: "#4757de",
      contrastText: "#f8fbff",
    },
    secondary: {
      main: "#55b7ff",
    },
    background: {
      default: "#17161b",
      paper: "#1f1d24",
    },
    text: {
      primary: "#f5f7ff",
      secondary: "#9b9ca7",
    },
    divider: "rgba(255,255,255,0.06)",
    success: {
      main: "#2ec27e",
    },
    warning: {
      main: "#f59f4c",
    },
    error: {
      main: "#ef6a6a",
    },
  },
  shape: {
    borderRadius: 18,
  },
  typography: {
    fontFamily: '"Inter", "Segoe UI", sans-serif',
    fontSize: 13,
    h4: {
      fontSize: "1.1rem",
      fontWeight: 700,
      letterSpacing: "-0.03em",
    },
    h5: {
      fontSize: "1.65rem",
      fontWeight: 800,
      letterSpacing: "-0.05em",
    },
    h6: {
      fontSize: "0.95rem",
      fontWeight: 700,
      letterSpacing: "-0.02em",
    },
    button: {
      textTransform: "none",
      fontWeight: 600,
      letterSpacing: "-0.01em",
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background:
            "radial-gradient(circle at top, rgba(95,111,255,0.08), transparent 22%), #17161b",
        },
        "*::-webkit-scrollbar": {
          width: 8,
          height: 8,
        },
        "*::-webkit-scrollbar-thumb": {
          background: "rgba(255,255,255,0.12)",
          borderRadius: 999,
        },
        "*::-webkit-scrollbar-track": {
          background: "transparent",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: "linear-gradient(180deg, rgba(33, 31, 39, 0.98), rgba(29, 27, 34, 0.98))",
          border: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "0 18px 45px rgba(0, 0, 0, 0.18)",
          backdropFilter: "blur(14px)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          minHeight: 38,
          paddingInline: 16,
        },
        contained: {
          background: "linear-gradient(135deg, #6f72ff 0%, #5256ef 100%)",
          boxShadow: "0 10px 22px rgba(82, 86, 239, 0.24)",
          "&:hover": {
            background: "linear-gradient(135deg, #8083ff 0%, #6064f3 100%)",
            boxShadow: "0 14px 24px rgba(82, 86, 239, 0.28)",
          },
        },
        outlined: {
          color: "#f5f7ff",
          borderColor: "rgba(255,255,255,0.1)",
          background: "rgba(255,255,255,0.02)",
          "&:hover": {
            borderColor: "rgba(95,111,255,0.3)",
            background: "rgba(95,111,255,0.08)",
          },
        },
        text: {
          color: "#c7d0ff",
          "&:hover": {
            background: "rgba(95,111,255,0.08)",
          },
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: "outlined",
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          background: "#26242c",
          "& fieldset": {
            borderColor: "rgba(255,255,255,0.08)",
          },
          "&:hover fieldset": {
            borderColor: "rgba(255,255,255,0.12)",
          },
          "&.Mui-focused fieldset": {
            borderColor: "#5f6fff",
            boxShadow: `0 0 0 3px ${alpha("#5f6fff", 0.12)}`,
          },
        },
        input: {
          fontSize: 13,
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: "#8f92a3",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          height: 28,
          borderRadius: 999,
          fontWeight: 600,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.06)",
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          background: "#141318",
          borderRight: "1px solid rgba(255,255,255,0.06)",
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          background: "rgba(255,255,255,0.06)",
        },
        bar: {
          borderRadius: 999,
          background: "linear-gradient(90deg, #5f6fff, #64b6ff)",
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          background: "#1f1d24",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 18,
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: 13,
        },
      },
    },
  },
});

export default theme;
