"use client";

import { THEME_EMOJI, useTheme } from "./use-theme";

export function ThemeToggle() {
  const { theme, cycleTheme } = useTheme();

  return (
    <button
      type="button"
      className="btn gh sm"
      id="theme"
      aria-label="Switch theme"
      onClick={cycleTheme}
    >
      <span aria-hidden="true">{THEME_EMOJI[theme]}</span>{" "}
      <span>{theme}</span>
    </button>
  );
}
