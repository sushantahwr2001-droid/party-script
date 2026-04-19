import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "dark",

    background: {
      default: "#08101d",
      paper: "rgba(10, 18, 32, 0.78)",
    },

    primary: {
      main: "#6d6bff",
      contrastText: "#f8fafc",
    },

    secondary: {
      main: "#38bdf8",
    },

    text: {
      primary: "#eef2ff",
      secondary: "#93a4bf",
    },
  },

  typography: {
    fontFamily: "Inter, sans-serif",
    fontSize: 13,

    h4: {
      fontSize: "17px",
      fontWeight: 600,
      letterSpacing: "-0.3px",
    },
  },

  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backdropFilter: "blur(14px)",
          background:
            "linear-gradient(180deg, rgba(15, 25, 46, 0.96), rgba(9, 16, 31, 0.92))",
          border: "1px solid rgba(94, 114, 165, 0.2)",
          borderRadius: 18,
          boxShadow: "0 22px 44px rgba(2, 6, 23, 0.22)",
          transition: "0.22s ease",
        },
      },
    },

    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: "none",
          fontWeight: 600,
          paddingInline: 16,
          transition: "all 0.22s ease",
        },
        contained: {
          background: "linear-gradient(135deg, #6d6bff, #5b52f0)",
          color: "#f8fafc",
          boxShadow: "0 10px 24px rgba(91, 82, 240, 0.28)",
          "&:hover": {
            background: "linear-gradient(135deg, #8186ff, #655cf5)",
            boxShadow: "0 14px 30px rgba(91, 82, 240, 0.32)",
          },
        },
        outlined: {
          color: "#edf2ff",
          borderColor: "rgba(109,123,169,0.28)",
          background: "rgba(14, 24, 43, 0.78)",
          "&:hover": {
            borderColor: "rgba(129,140,248,0.56)",
            background: "rgba(99, 102, 241, 0.16)",
          },
        },
      },
    },

    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          height: 28,
          fontWeight: 600,
          background: "rgba(148,163,184,0.12)",
          border: "1px solid rgba(148,163,184,0.08)",
        },
      },
    },

    MuiTabs: {
      styleOverrides: {
        indicator: {
          background: "linear-gradient(90deg, #6d6bff, #38bdf8)",
        },
      },
    },
  },
});

export default theme;
