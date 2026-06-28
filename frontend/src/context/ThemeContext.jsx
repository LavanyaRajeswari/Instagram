import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getSettings, setTheme as saveThemeApi } from "../api/settingsApi";
import { getAuthToken } from "../api/config";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => localStorage.getItem("app-theme") || "light");

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("app-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!getAuthToken()) return;
    getSettings().then((s) => {
      if (s?.theme === "DARK") setThemeState("dark");
    }).catch(() => {});
  }, []);

  const setTheme = useCallback((val) => {
    const apiVal = val === "DARK" || val === "dark" ? "DARK" : "LIGHT";
    const normalized = apiVal === "DARK" ? "dark" : "light";
    setThemeState(normalized);
    saveThemeApi(apiVal).catch(() => {});
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      saveThemeApi(next === "dark" ? "DARK" : "LIGHT").catch(() => {});
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
