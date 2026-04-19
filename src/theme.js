import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "dark",

    background: {
      default: "#0a0f18",
      paper: "#101826",
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
          background: "#101826",
          border: "1px solid rgba(94, 114, 165, 0.16)",
          borderRadius: 18,
          boxShadow: "0 10px 28px rgba(2, 6, 23, 0.22)",
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
          background: "#5f65f6",
          color: "#f8fafc",
          boxShadow: "0 8px 20px rgba(91, 82, 240, 0.24)",
          "&:hover": {
            background: "#7077ff",
            boxShadow: "0 10px 24px rgba(91, 82, 240, 0.28)",
          },
        },
        outlined: {
          color: "#edf2ff",
          borderColor: "rgba(109,123,169,0.28)",
          background: "#111a29",
          "&:hover": {
            borderColor: "rgba(129,140,248,0.56)",
            background: "#172236",
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
          background: "#151f2f",
          border: "1px solid rgba(148,163,184,0.08)",
        },
      },
    },

    MuiTabs: {
      styleOverrides: {
        indicator: {
          background: "#6d6bff",
        },
      },
    },
  },
});

export default theme;
