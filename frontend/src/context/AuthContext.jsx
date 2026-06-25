import React, { createContext, useContext, useState, useEffect } from "react";
import { getMe } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(
    localStorage.getItem("tms_token") || null
  );
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("tms_user")) || null
  );
  const [loading, setLoading] = useState(false);

  const login = (jwtToken, userData) => {
    setToken(jwtToken);
    setUser(userData);
    localStorage.setItem("tms_token", jwtToken);
    localStorage.setItem("tms_user", JSON.stringify(userData));
  };

  // Refresh the cached user from the server so an admin's role change (or any
  // profile update) is reflected without a full re-login. A 401 here triggers
  // auto-logout via the api interceptor.
  const refreshUser = async () => {
    if (!token) return;
    try {
      const res = await getMe(token);
      if (res.data?.user) {
        setUser(res.data.user);
        localStorage.setItem("tms_user", JSON.stringify(res.data.user));
      }
    } catch (_) {
      /* 401 handled by interceptor; ignore transient/forbidden responses */
    }
  };

  useEffect(() => {
    refreshUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("tms_token");
    localStorage.removeItem("tms_user");
  };

  return (
    <AuthContext.Provider
      value={{ token, user, loading, setLoading, login, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
}