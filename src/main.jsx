import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { CssBaseline, ThemeProvider } from "@mui/material";
import App from "./App";
import theme from "./theme";
import { AuthProvider } from "./context/AuthContext";
import AppErrorBoundary from "./components/AppErrorBoundary";

ReactDOM.createRoot(document.getElementById("root")).render(
  <AppErrorBoundary>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </AppErrorBoundary>
);
