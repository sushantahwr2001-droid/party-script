import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "../lib/api";
import type { AuthContextValue, UserSummary } from "../types";

const STORAGE_KEY = "party-script-auth-token";

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY));
  const [user, setUser] = useState<UserSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function hydrate() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.me(token);
        setUser(response.user);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    void hydrate();
  }, [token]);

  async function login(email: string, password: string) {
    const response = await api.login(email, password);
    localStorage.setItem(STORAGE_KEY, response.token);
    setToken(response.token);
    setUser(response.user);
  }

  async function register(name: string, email: string, password: string, organizationName?: string) {
    const response = await api.register(name, email, password, organizationName);
    localStorage.setItem(STORAGE_KEY, response.token);
    setToken(response.token);
    setUser(response.user);
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setUser(null);
  }

  return <AuthContext.Provider value={{ token, user, loading, login, register, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider.");
  return context;
}
