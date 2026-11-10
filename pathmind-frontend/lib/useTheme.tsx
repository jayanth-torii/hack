"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type Theme = "dark" | "light";

interface ThemeContextValue {
  theme: Theme;
  toggle: () => void;
  /** False while light mode is hidden — the toggle uses this to render nothing. */
  enabled: boolean;
}

/**
 * Light mode is hidden: the product ships dark-only for now. The light palette
 * is still in `globals.css` under `html.light` and every component still reads
 * its colours from tokens, so bringing it back is this one flag — nothing else
 * had to be deleted, and nothing rots in the meantime.
 */
export const LIGHT_MODE_ENABLED = false;

const STORAGE_KEY = "vidhyora-theme";

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  toggle: () => {},
  enabled: LIGHT_MODE_ENABLED,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");

  // Initial theme: stored preference, else the OS preference. While light mode
  // is hidden neither is consulted — a visitor who switched to light before we
  // hid it would otherwise be stuck there with no way back.
  useEffect(() => {
    if (!LIGHT_MODE_ENABLED) return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "light" || stored === "dark") {
        setTheme(stored);
        return;
      }
    } catch {
      /* storage unavailable — fall through to system preference */
    }
    if (window.matchMedia("(prefers-color-scheme: light)").matches) {
      setTheme("light");
    }
  }, []);

  // Apply the class + persist whenever the theme changes.
  useEffect(() => {
    const isLight = LIGHT_MODE_ENABLED && theme === "light";
    document.documentElement.classList.toggle("light", isLight);
    if (!LIGHT_MODE_ENABLED) return;
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  const toggle = () => {
    if (!LIGHT_MODE_ENABLED) return;
    const root = document.documentElement;
    root.classList.add("theme-switching");
    window.setTimeout(() => root.classList.remove("theme-switching"), 500);
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggle, enabled: LIGHT_MODE_ENABLED }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
