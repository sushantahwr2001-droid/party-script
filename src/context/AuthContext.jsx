import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthContext } from "./auth-context";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";

const DISPLAY_NAME_STORAGE_KEY = "party-script-display-name";

function getStoredDisplayName() {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(DISPLAY_NAME_STORAGE_KEY) || "";
}

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
    getStoredDisplayName() ||
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

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [authError, setAuthError] = useState("");
  const [authDebug, setAuthDebug] = useState("");

  const hydrateUser = async (authUser) => {
    const profile = await getProfileForUser(authUser);
    const nextUser = buildAppUser(authUser, profile);
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
      setUser(null);
      setAuthError("");
      setAuthDebug("");
    };

    const syncAuthSession = async (session) => {
      if (!active) {
        return;
      }

      const authUser = session?.user ?? null;

      if (!authUser) {
        clearAuthState();
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        await hydrateUser(authUser);
      } catch (profileError) {
        if (!active) {
          return;
        }

        setUser(null);
        setAuthError(profileError.message);
        setAuthDebug(formatAuthError(profileError));
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    const bootstrapSession = async () => {
      setLoading(true);

      try {
        const { data, error } = await supabase.auth.getSession();

        if (!active) {
          return;
        }

        if (error) {
          setUser(null);
          setAuthError(error.message);
          setAuthDebug(formatAuthError(error));
          setLoading(false);
          return;
        }

        await syncAuthSession(data.session);
      } catch (sessionError) {
        if (!active) {
          return;
        }

        clearAuthState();
        setAuthError(sessionError.message);
        setAuthDebug(formatAuthError(sessionError));
        setLoading(false);
      }
    };

    bootstrapSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) {
        return;
      }

      void syncAuthSession(session);
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
    setUser(null);
  };

  const sendPasswordReset = useCallback(async () => {
    if (!user?.email || !supabase) {
      throw new Error("You must be signed in to reset your password.");
    }

    const redirectTo =
      typeof window !== "undefined" ? `${window.location.origin}/login` : undefined;

    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo,
    });

    if (error) {
      throw error;
    }

    return true;
  }, [user]);

  const updateProfileName = useCallback(async (fullName) => {
    if (!user || !supabase) {
      throw new Error("You must be signed in to update your profile.");
    }

    const trimmed = fullName?.trim();

    if (!trimmed) {
      throw new Error("Name is required.");
    }

    if (typeof window !== "undefined") {
      window.localStorage.setItem(DISPLAY_NAME_STORAGE_KEY, trimmed);
    }

    let nextData;

    const { data, error } = await supabase
      .from("profiles")
      .update({ full_name: trimmed })
      .eq("id", user.id)
      .select("id, full_name, role, organization_id")
      .single();

    if (error) {
      const isRecursivePolicyError = error.message?.toLowerCase().includes("infinite recursion");

      if (!isRecursivePolicyError) {
        throw error;
      }

      const { error: authUpdateError } = await supabase.auth.updateUser({
        data: {
          full_name: trimmed,
          name: trimmed,
        },
      });

      if (authUpdateError) {
        throw authUpdateError;
      }

      nextData = {
        id: user.id,
        full_name: trimmed,
        role: user.role,
        organization_id: user.organizationId,
      };
    } else {
      nextData = data;
    }

    setUser((current) =>
      current
        ? {
            ...current,
            name: nextData.full_name || current.name,
            role: nextData.role,
            organizationId: nextData.organization_id,
          }
        : current
    );

    return nextData;
  }, [user]);

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
      sendPasswordReset,
      updateProfileName,
      authError,
      authDebug,
      permissions,
      isConfigured: isSupabaseConfigured,
    }),
    [user, loading, authError, authDebug, permissions, updateProfileName, sendPasswordReset]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
