"use client";

import { Button, ButtonLink } from "@/components/ui/button";
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
import { ThemeToggle } from "./theme-toggle";
import { THEME_EMOJI, useTheme } from "./use-theme";

const DESKTOP_NAV_MQ = "(min-width: 768px)";
const FOCUSABLE = "a[href], button:not([disabled]):not([tabindex='-1'])";

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

  // Close when the viewport becomes desktop-sized
  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_NAV_MQ);
    const onChange = () => {
      if (mq.matches) close();
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [close]);

  // Keep the sheet aligned under the header
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

  // Scroll lock
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Keyboard, outside click, focus management
  useEffect(() => {
    if (!open) return;

    const getItems = () =>
      Array.from(
        dropdownRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [],
      );

    getItems()[0]?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        close();
        triggerRef.current?.focus();
        return;
      }
      if (e.key !== "Tab") return;

      // Keep Tab inside: trigger + menu items form one ring
      const ring = [triggerRef.current, ...getItems()].filter(
        Boolean,
      ) as HTMLElement[];
      const idx = ring.indexOf(document.activeElement as HTMLElement);
      const step = e.shiftKey ? -1 : 1;
      const next = ring[(idx + step + ring.length) % ring.length];
      e.preventDefault();
      next?.focus();
    }

    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (dropdownRef.current?.contains(target)) return;
      close();
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open, close]);

  const menuPanel = open ? (
    <>
      <button
        type="button"
        className="nav-dropdown-backdrop"
        tabIndex={-1}
        aria-hidden="true"
        onClick={close}
      />
      <div
        id={menuId}
        ref={dropdownRef}
        className="nav-dropdown nav-dropdown--viewport"
        aria-label="Site menu"
      >
        <MenuItemLink href="/auth/login" onClick={close}>
          Log in
        </MenuItemLink>
        <MenuItemLink href="/auth/signup" variant="primary" onClick={close}>
          Get started
        </MenuItemLink>
        <MenuItemButton onClick={cycleTheme}>
          <span className="nav-dropdown-theme-label">Theme</span>
          <span className="nav-dropdown-theme-value">
            <span aria-hidden="true">{THEME_EMOJI[theme]}</span> {theme}
          </span>
        </MenuItemButton>
      </div>
    </>
  ) : null;

  return (
    <nav className="nav" aria-label="Main">
      <div className="nav-desktop">
        <ThemeToggle />
        <ButtonLink href="/auth/login" variant="ghost" size="sm">
          Log in
        </ButtonLink>
        <ButtonLink href="/auth/signup" size="sm">
          Get started
        </ButtonLink>
      </div>
      <div className="nav-menu-wrap">
        <Button
          ref={triggerRef}
          variant="ghost"
          size="sm"
          className="nav-menu-trigger"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls={open ? menuId : undefined}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? (
            <X size={20} strokeWidth={1.75} aria-hidden="true" />
          ) : (
            <Menu size={20} strokeWidth={1.75} aria-hidden="true" />
          )}
        </Button>
        {menuPanel && createPortal(menuPanel, document.body)}
      </div>
    </nav>
  );
}