import { useEffect, useMemo, useRef, useState } from "react";
import { AuthContext } from "./auth-context";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";

const AUTH_REQUEST_TIMEOUT_MS = 10000;

function formatAuthError(error) {
  if (!error) {
    return "";
  }

  const parts = [error.message || "Unknown auth error"];

  if (error.code) {
    parts.push(`code: ${error.code}`);
  }

  if (error.status) {
    parts.push(`status: ${error.status}`);
  }

  return parts.join(" / ");
}

function buildAppUser(authUser, profile) {
  if (!authUser) {
    return null;
  }

  const displayName =
    profile.full_name ||
    authUser.user_metadata?.full_name ||
    authUser.user_metadata?.name ||
    authUser.email?.split("@")[0] ||
    "Party OS User";

  return {
    id: authUser.id,
    email: authUser.email,
    name: displayName,
    role: profile.role,
    organizationId: profile.organization_id,
    events: [],
  };
}

async function loadProfileRow(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, role, organization_id")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

async function getProfileForUser(authUser) {
  const existingProfile = await loadProfileRow(authUser.id);

  if (existingProfile) {
    return existingProfile;
  }
  throw new Error("Your account is missing a profile row. Contact an admin to finish setup.");
}

async function withTimeout(promise, message) {
  let timerId;

  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timerId = window.setTimeout(() => reject(new Error(message)), AUTH_REQUEST_TIMEOUT_MS);
      }),
    ]);
  } finally {
    window.clearTimeout(timerId);
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [authError, setAuthError] = useState("");
  const [authDebug, setAuthDebug] = useState("");
  const hydratedUserIdRef = useRef(null);
  const hydratingUserIdRef = useRef(null);

  const hydrateUser = async (authUser) => {
    const profile = await getProfileForUser(authUser);
    const nextUser = buildAppUser(authUser, profile);
    hydratedUserIdRef.current = authUser.id;
    setUser(nextUser);
    setAuthError("");
    setAuthDebug("");
    return nextUser;
  };

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      return undefined;
    }

    let active = true;

    const clearAuthState = () => {
      hydratedUserIdRef.current = null;
      hydratingUserIdRef.current = null;
      setUser(null);
      setAuthError("");
      setAuthDebug("");
    };

    const syncAuthUser = async (authUser) => {
      if (!active) {
        return;
      }

      if (!authUser) {
        clearAuthState();
        setLoading(false);
        return;
      }

      if (
        hydratedUserIdRef.current === authUser.id ||
        hydratingUserIdRef.current === authUser.id
      ) {
        setLoading(false);
        return;
      }

      hydratingUserIdRef.current = authUser.id;
      setLoading(true);

      try {
        await withTimeout(
          hydrateUser(authUser),
          "Profile loading timed out. Please try signing in again."
        );
      } catch (profileError) {
        if (!active) {
          return;
        }

        hydratedUserIdRef.current = null;
        setUser(null);
        setAuthError(profileError.message);
        setAuthDebug(formatAuthError(profileError));
      } finally {
        if (hydratingUserIdRef.current === authUser.id) {
          hydratingUserIdRef.current = null;
        }

        if (active) {
          setLoading(false);
        }
      }
    };

    const bootstrapSession = async () => {
      try {
        const { data, error } = await withTimeout(
          supabase.auth.getSession(),
          "Session restore timed out. Please sign in again."
        );

        if (!active) {
          return;
        }

        if (error) {
          setUser(null);
          setAuthError(error.message);
          setAuthDebug(formatAuthError(error));
          return;
        }

        await syncAuthUser(data.session?.user ?? null);
      } catch (sessionError) {
        if (!active) {
          return;
        }

        clearAuthState();
        setAuthError(sessionError.message);
        setAuthDebug(formatAuthError(sessionError));
      }
    };

    bootstrapSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) {
        return;
      }

      void syncAuthUser(session?.user ?? null);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    if (!email?.trim() || !password) {
      throw new Error("Email and password are required.");
    }

    if (!isSupabaseConfigured || !supabase) {
      throw new Error("Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.");
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setLoading(false);
      setAuthDebug(formatAuthError(error));
      if (error.message?.toLowerCase().includes("invalid login credentials")) {
        throw new Error("Incorrect email or password.");
      }

      throw error;
    }
    hydratedUserIdRef.current = null;
    setAuthError("");
    setAuthDebug("");
    return data;
  };

  const signup = async (email, password) => {
    if (!email?.trim() || !password) {
      throw new Error("Email and password are required.");
    }

    if (!isSupabaseConfigured || !supabase) {
      throw new Error(
        "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY."
      );
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    if (error) {
      setLoading(false);
      setAuthDebug(formatAuthError(error));
      throw error;
    }

    if (!data.user) {
      setLoading(false);
      setAuthDebug("Signup returned no user object.");
      throw new Error("Unable to create your account right now.");
    }

    // If email confirmation is enabled, the session may be null until verified.
    if (!data.session) {
      setAuthError("Account created. Check your email to confirm your account, then sign in.");
      setAuthDebug("");
      setLoading(false);
      return { requiresEmailConfirmation: true };
    }

    hydratedUserIdRef.current = null;
    setAuthError("");
    setAuthDebug("");
    return { requiresEmailConfirmation: false };
  };

  const logout = async () => {
    if (supabase) {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }
    }

    setAuthError("");
    setAuthDebug("");
    hydratedUserIdRef.current = null;
    setUser(null);
  };

  const permissions = useMemo(
    () => ({
      canEditAll: !!user,
      canManageVendors: !!user,
      canManageBudget: user?.role === "admin",
      canManageContacts: !!user,
      canManageTasks: !!user,
      canManageDocuments: !!user,
    }),
    [user]
  );

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      signup,
      logout,
      authError,
      authDebug,
      permissions,
      isConfigured: isSupabaseConfigured,
    }),
    [user, loading, authError, authDebug, permissions]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
