import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { CssBaseline, ThemeProvider } from "@mui/material";
import App from "./App";
import { getAppTheme } from "./theme";
import { AuthProvider } from "./context/AuthContext";
import AppErrorBoundary from "./components/AppErrorBoundary";
import { AppSettingsProvider, useAppSettings } from "./context/AppSettingsContext";

function ThemedApp() {
  const { settings } = useAppSettings();
  const theme = React.useMemo(
    () => getAppTheme(settings.themeMode),
    [settings.themeMode]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <AppErrorBoundary>
    <AppSettingsProvider>
      <ThemedApp />
    </AppSettingsProvider>
  </AppErrorBoundary>
);
