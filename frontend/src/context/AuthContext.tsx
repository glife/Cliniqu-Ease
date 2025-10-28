import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "../lib/api";

type AuthValue = {
  user: { id: number; username: string } | null;
  login: (username: string, password: string) => Promise<any>;
  signup: (username: string, password: string) => Promise<any>;
  logout: () => void;
};

const AuthContext = createContext<AuthValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ id: number; username: string } | null>(() => {
    try {
      return JSON.parse(localStorage.getItem("mc_user") || "null");
    } catch {
      return null;
    }
  });

  useEffect(() => {
    localStorage.setItem("mc_user", JSON.stringify(user));
  }, [user]);

  const login = async (username: string, password: string) => {
    const res = await api("/login", "POST", { username, password });
    setUser({ id: res.user_id, username });
    return res;
  };

  const signup = async (username: string, password: string) => {
    const res = await api("/signup", "POST", { username, password });
    setUser({ id: res.user_id, username });
    return res;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("mc_user");
  };

  return <AuthContext.Provider value={{ user, login, signup, logout }}>{children}</AuthContext.Provider>;
}


