import { createTheme } from "@mui/material/styles";

function buildPalette(mode) {
  if (mode === "light") {
    return {
      mode: "light",
      background: {
        default: "#eef3fb",
        paper: "#ffffff",
      },
      primary: {
        main: "#4f63ff",
        contrastText: "#ffffff",
      },
      secondary: {
        main: "#2f88ff",
      },
      text: {
        primary: "#101828",
        secondary: "#667085",
      },
      divider: "rgba(15, 23, 42, 0.08)",
    };
  }

  return {
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
    divider: "rgba(94, 114, 165, 0.16)",
  };
}

export function getAppTheme(mode = "dark") {
  const palette = buildPalette(mode);
  const isLight = palette.mode === "light";

  return createTheme({
    palette,
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
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: palette.background.default,
            color: palette.text.primary,
          },
        },
      },

      MuiCard: {
        styleOverrides: {
          root: {
            background: palette.background.paper,
            border: `1px solid ${palette.divider}`,
            borderRadius: 18,
            boxShadow: isLight
              ? "0 18px 40px rgba(18, 38, 63, 0.08)"
              : "0 10px 28px rgba(2, 6, 23, 0.22)",
            transition: "0.22s ease",
          },
        },
      },

      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
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
            background: isLight ? "#4f63ff" : "#5f65f6",
            color: isLight ? "#ffffff" : "#f8fafc",
            boxShadow: isLight
              ? "0 12px 28px rgba(79, 99, 255, 0.18)"
              : "0 8px 20px rgba(91, 82, 240, 0.24)",
            "&:hover": {
              background: isLight ? "#5b70ff" : "#7077ff",
              boxShadow: isLight
                ? "0 14px 30px rgba(79, 99, 255, 0.22)"
                : "0 10px 24px rgba(91, 82, 240, 0.28)",
            },
          },
          outlined: {
            color: isLight ? "#0f172a" : "#edf2ff",
            borderColor: isLight ? "rgba(79,99,255,0.22)" : "rgba(109,123,169,0.28)",
            background: isLight ? "#f8faff" : "#111a29",
            "&:hover": {
              borderColor: isLight ? "rgba(79,99,255,0.4)" : "rgba(129,140,248,0.56)",
              background: isLight ? "#eef3ff" : "#172236",
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
            background: isLight ? "#eff4ff" : "#151f2f",
            border: isLight
              ? "1px solid rgba(79, 99, 255, 0.12)"
              : "1px solid rgba(148,163,184,0.08)",
          },
        },
      },

      MuiTabs: {
        styleOverrides: {
          indicator: {
            background: palette.primary.main,
          },
        },
      },
    },
  });
}

export default getAppTheme;

