import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";

const AuthContext = createContext(null);

// Replace your old API definition with this:
const API = axios.create({
  // 1. Clean up the logic to only point to the base /api route
  baseURL: process.env.REACT_APP_API_URL 
    ? `${process.env.REACT_APP_API_URL.replace(/\/$/, "")}/api` 
    : "https://startup-dashboard-3v28.onrender.com/api",
  withCredentials: true,
});

// Attach token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("mm_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("mm_token");
      localStorage.removeItem("mm_user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(() => { try { return JSON.parse(localStorage.getItem("mm_user")); } catch { return null; } });
  const [token, setToken]     = useState(() => localStorage.getItem("mm_token"));
  const [loading, setLoading] = useState(true);

  // Verify token on mount
  useEffect(() => {
    if (!token) { setLoading(false); return; }
    API.get("/auth/me")
      .then((r) => { setUser(r.data.data); localStorage.setItem("mm_user", JSON.stringify(r.data.data)); })
      .catch(() => { localStorage.removeItem("mm_token"); localStorage.removeItem("mm_user"); setToken(null); setUser(null); })
      .finally(() => setLoading(false));
  }, [token]);

  const login = useCallback(async (email, password) => {
    const { data } = await API.post("/auth/login", { email, password });
    localStorage.setItem("mm_token", data.data.token);
    localStorage.setItem("mm_user", JSON.stringify(data.data.user));
    setToken(data.data.token);
    setUser(data.data.user);
    return data.data;
  }, []);

  const register = useCallback(async (payload) => {
    const { data } = await API.post("/auth/register", payload);
    localStorage.setItem("mm_token", data.data.token);
    localStorage.setItem("mm_user", JSON.stringify(data.data.user));
    setToken(data.data.token);
    setUser(data.data.user);
    return data.data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("mm_token");
    localStorage.removeItem("mm_user");
    setToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback((updates) => {
    setUser((prev) => { const u = { ...prev, ...updates }; localStorage.setItem("mm_user", JSON.stringify(u)); return u; });
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};

export { API };
