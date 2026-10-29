import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

export const navMenuItemVariants = {
  default: "nav-dropdown-item",
  primary: "nav-dropdown-item nav-dropdown-item--primary",
} as const;

export type NavMenuItemVariant = keyof typeof navMenuItemVariants;

type NavMenuItemLinkProps = ComponentPropsWithoutRef<typeof Link> & {
  variant?: NavMenuItemVariant;
  href: string;
  children: ReactNode;
};

export function NavMenuItemLink({
  variant = "default",
  className,
  children,
  ...props
}: NavMenuItemLinkProps) {
  return (
    <Link
      role="menuitem"
      className={cn(navMenuItemVariants[variant], className)}
      {...props}
    >
      {children}
    </Link>
  );
}

type NavMenuItemButtonProps = ComponentPropsWithoutRef<"button"> & {
  variant?: NavMenuItemVariant;
  children: ReactNode;
};

export function NavMenuItemButton({
  variant = "default",
  className,
  children,
  ...props
}: NavMenuItemButtonProps) {
  return (
    <button
      type="button"
      role="menuitem"
      className={cn(navMenuItemVariants[variant], className)}
      {...props}
    >
      {children}
    </button>
  );
}
