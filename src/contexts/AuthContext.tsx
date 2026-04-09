"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User } from "@/types";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else if (res.status === 401 || res.status === 403) {
        // Truly unauthorized (bad/expired token) — clear local user state.
        setUser(null);
      }
      // For 5xx errors (DB down, cold-start lag, etc.) keep the existing user
      // state so the user is not silently logged out due to a transient error.
    } catch {
      // Network error — keep existing state to avoid a false logout.
      // Log nothing: this can fire on page unload and is not actionable.
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      let errorMessage = "Erro ao fazer login";
      try {
        const data = await res.json();
        errorMessage = data.error || errorMessage;
      } catch {
        // response was not JSON (e.g., an HTML error page from the server)
      }
      throw new Error(errorMessage);
    }

    const data = await res.json();
    setUser(data.user);
  };

  const register = async (name: string, email: string, password: string) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    if (!res.ok) {
      let errorMessage = "Erro ao criar conta";
      try {
        const data = await res.json();
        errorMessage = data.error || errorMessage;
      } catch {
        // response was not JSON (e.g., an HTML error page from the server)
      }
      throw new Error(errorMessage);
    }

    const data = await res.json();
    setUser(data.user);
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/me", { method: "DELETE" });
    } catch {
      console.warn("[auth] logout API call failed — cookie may still expire naturally");
    }
    setUser(null);
    // Hard redirect so the browser fully clears React state, re-reads the
    // (now-deleted) cookie, and runs middleware on the new page load.
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
