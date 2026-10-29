import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

export const menuItemVariants = {
  default: "",
  primary: "nav-dropdown-item--primary",
} as const;

export type MenuItemVariant = keyof typeof menuItemVariants;

function menuItemClasses(variant: MenuItemVariant, className?: string) {
  return cn("nav-dropdown-item", menuItemVariants[variant], className);
}

type MenuItemLinkProps = ComponentPropsWithoutRef<typeof Link> & {
  variant?: MenuItemVariant;
};

export function MenuItemLink({
  variant = "default",
  className,
  ...props
}: MenuItemLinkProps) {
  return (
    <Link
      className={menuItemClasses(variant, className)}
      role="menuitem"
      {...props}
    />
  );
}

type MenuItemButtonProps = ComponentPropsWithoutRef<"button"> & {
  variant?: MenuItemVariant;
};

export function MenuItemButton({
  variant = "default",
  className,
  type = "button",
  ...props
}: MenuItemButtonProps) {
  return (
    <button
      type={type}
      className={menuItemClasses(variant, className)}
      role="menuitem"
      {...props}
    />
  );
}
