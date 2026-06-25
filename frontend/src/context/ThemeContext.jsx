import React, { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);

// Reads the initial theme from the <html> class (set by the pre-paint script in
// index.html), falling back to stored preference / system. Toggling updates the
// <html> class and persists to localStorage. The actual color flip is handled
// entirely in CSS via the .dark token overrides.
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    if (typeof document !== "undefined" && document.documentElement.classList.contains("dark")) {
      return "dark";
    }
    if (typeof localStorage !== "undefined" && localStorage.getItem("tms_theme")) {
      return localStorage.getItem("tms_theme");
    }
    return "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    try {
      localStorage.setItem("tms_theme", theme);
    } catch (e) {
      /* ignore storage failures */
    }
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within <ThemeProvider>");
  return ctx;
}
