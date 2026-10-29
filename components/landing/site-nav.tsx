"use client";

import { Button } from "@/components/ui/button";
import { MenuItemButton, MenuItemLink } from "@/components/ui/menu-item";
import { Menu, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { THEME_EMOJI, useTheme } from "./use-theme";

function syncNavSheetTop() {
  const header = document.getElementById("top");
  if (!header) return;
  const bottom = header.getBoundingClientRect().bottom;
  document.documentElement.style.setProperty("--nav-sheet-top", `${bottom}px`);
}

export function SiteNav() {
  const [open, setOpen] = useState(false);
  const { theme, cycleTheme } = useTheme();
  const menuId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useLayoutEffect(() => {
    if (!open) return;
    syncNavSheetTop();
    window.addEventListener("resize", syncNavSheetTop);
    window.addEventListener("scroll", syncNavSheetTop, { passive: true });
    return () => {
      window.removeEventListener("resize", syncNavSheetTop);
      window.removeEventListener("scroll", syncNavSheetTop);
    };
  }, [open]);

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
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (dropdownRef.current?.contains(target)) return;
      close();
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [open, close]);

  const menuPanel = open ? (
    <>
      <button
        type="button"
        className="nav-dropdown-backdrop"
        aria-label="Close menu"
        onClick={close}
      />
      <div
        id={menuId}
        ref={dropdownRef}
        className="nav-dropdown nav-dropdown--viewport"
        role="menu"
        aria-label="Site menu"
      >
        <MenuItemLink href="/login" onClick={close}>
          Log in
        </MenuItemLink>
        <MenuItemLink href="/login#signup" variant="primary" onClick={close}>
          Get started
        </MenuItemLink>
        <MenuItemButton
          onClick={() => {
            cycleTheme();
          }}
        >
          <span className="nav-dropdown-theme-label">Theme</span>
          <span className="nav-dropdown-theme-value">
            <span aria-hidden="true">{THEME_EMOJI[theme]}</span> {theme}
          </span>
        </MenuItemButton>
      </div>
    </>
  ) : null;

  return (
    <div className="nav-menu-wrap">
      <Button
        ref={triggerRef}
        variant="ghost"
        size="sm"
        className="nav-menu-trigger"
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
      </Button>
      {typeof document !== "undefined" &&
        menuPanel &&
        createPortal(menuPanel, document.body)}
    </div>
  );
}
