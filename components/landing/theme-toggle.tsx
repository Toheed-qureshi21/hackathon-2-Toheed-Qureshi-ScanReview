"use client";

import { Button } from "@/components/ui/button";
import { THEME_EMOJI, useTheme } from "./use-theme";

export function ThemeToggle() {
  const { theme, cycleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="sm"
      id="theme"
      aria-label="Switch theme"
      onClick={cycleTheme}
    >
      <span aria-hidden="true">{THEME_EMOJI[theme]}</span>{" "}
      <span>{theme}</span>
    </Button>
  );
}
