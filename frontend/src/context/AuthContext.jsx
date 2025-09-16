import React, { createContext, useState, useEffect } from "react";
import * as authService from "../services/auth";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem("accessToken");
    return token ? { token } : null;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // optional: validate token with backend
  }, []);

  const login = async (username, password) => {
    setLoading(true);
    const res = await authService.loginApi(username, password);
    setLoading(false);
    if (res.success) {
      localStorage.setItem("accessToken", res.token);
      setUser({ token: res.token, username });
      return { ok: true };
    } else {
      return { ok: false, error: res.error || "Login failed" };
    }
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    setUser(null);
  };

  const register = async (username, password) => {
    setLoading(true);
    const res = await authService.registerApi(username, password);
    setLoading(false);
    return res;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}