"use client";

import { useCallback, useSyncExternalStore } from "react";

const THEMES = ["light", "dark", "natural"] as const;
type Theme = (typeof THEMES)[number];

const THEME_CHANGE = "sr-theme-change";

const EMOJI: Record<Theme, string> = {
  light: "☀️",
  dark: "🌙",
  natural: "🌿",
};

function readTheme(): Theme {
  try {
    const stored = localStorage.getItem("sr-theme") as Theme | null;
    if (stored && THEMES.includes(stored)) return stored;
  } catch {
    /* ignore */
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function getThemeSnapshot(): Theme {
  const fromDom = document.documentElement.dataset.theme as Theme | undefined;
  if (fromDom && THEMES.includes(fromDom)) return fromDom;
  return readTheme();
}

function getServerThemeSnapshot(): Theme {
  return "light";
}

function subscribe(onStoreChange: () => void) {
  const onThemeChange = () => onStoreChange();
  window.addEventListener(THEME_CHANGE, onThemeChange);
  window.addEventListener("storage", onThemeChange);
  return () => {
    window.removeEventListener(THEME_CHANGE, onThemeChange);
    window.removeEventListener("storage", onThemeChange);
  };
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem("sr-theme", theme);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(THEME_CHANGE));
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(
    subscribe,
    getThemeSnapshot,
    getServerThemeSnapshot,
  );

  const cycle = useCallback(() => {
    const current = getThemeSnapshot();
    const next = THEMES[(THEMES.indexOf(current) + 1) % THEMES.length];
    applyTheme(next);
  }, []);

  return (
    <button
      type="button"
      className="btn gh sm"
      id="theme"
      aria-label="Switch theme"
      onClick={cycle}
    >
      <i aria-hidden="true">{EMOJI[theme]}</i>{" "}
      <span>{theme}</span>
    </button>
  );
}
