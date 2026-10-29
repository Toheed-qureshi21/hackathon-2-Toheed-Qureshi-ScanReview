"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { THEME_EMOJI, useTheme } from "./use-theme";

export function SiteNav() {
  const [open, setOpen] = useState(false);
  const { theme, cycleTheme } = useTheme();
  const menuId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    function onPointerDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        close();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [open, close]);

  return (
    <div className="nav-menu-wrap" ref={wrapRef}>
      <button
        type="button"
        className="nav-menu-trigger btn gh sm"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? (
          <X size={20} strokeWidth={1.75} aria-hidden="true" />
        ) : (
          <Menu size={20} strokeWidth={1.75} aria-hidden="true" />
        )}
      </button>

      {open ? (
        <div
          id={menuId}
          className="nav-dropdown"
          role="menu"
          aria-label="Site menu"
        >
          <Link
            className="nav-dropdown-item"
            href="/login"
            role="menuitem"
            onClick={close}
          >
            Log in
          </Link>
          <Link
            className="nav-dropdown-item nav-dropdown-item--primary"
            href="/login#signup"
            role="menuitem"
            onClick={close}
          >
            Get started
          </Link>
          <button
            type="button"
            className="nav-dropdown-item"
            role="menuitem"
            onClick={() => {
              cycleTheme();
            }}
          >
            <span className="nav-dropdown-theme-label">Theme</span>
            <span className="nav-dropdown-theme-value">
              <span aria-hidden="true">{THEME_EMOJI[theme]}</span> {theme}
            </span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
