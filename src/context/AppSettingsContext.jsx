import { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "party-script-app-settings";

const defaultSettings = {
  themeMode: "dark",
  accentColor: "electric-blue",
  defaultPage: "/",
  companyName: "Party Script",
  currency: "INR",
  timeZone: "Asia/Kolkata",
  phone: "",
  eventReminders: true,
  taskAlerts: true,
  emailNotifications: false,
  profilePhoto: "",
  organizationLogo: "",
};

const AppSettingsContext = createContext(null);

function readStoredSettings() {
  if (typeof window === "undefined") {
    return defaultSettings;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return defaultSettings;
    }

    return {
      ...defaultSettings,
      ...JSON.parse(raw),
    };
  } catch {
    return defaultSettings;
  }
}

export function AppSettingsProvider({ children }) {
  const [settings, setSettings] = useState(readStoredSettings);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (patch) => {
    setSettings((current) => ({
      ...current,
      ...patch,
    }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  const value = useMemo(
    () => ({
      settings,
      updateSettings,
      resetSettings,
    }),
    [settings]
  );

  return <AppSettingsContext.Provider value={value}>{children}</AppSettingsContext.Provider>;
}

export function useAppSettings() {
  const context = useContext(AppSettingsContext);

  if (!context) {
    throw new Error("useAppSettings must be used inside AppSettingsProvider.");
  }

  return context;
}

