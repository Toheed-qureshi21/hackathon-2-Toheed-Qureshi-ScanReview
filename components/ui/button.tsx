import Link from "next/link";
import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

export const buttonVariants = {
  primary: "pri",
  ghost: "gh",
  band: "",
} as const;

export type ButtonVariant = keyof typeof buttonVariants;

export type ButtonSize = "default" | "sm";

export function buttonClasses({
  variant = "primary",
  size = "default",
  fullWidth = false,
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
}) {
  return cn(
    "btn",
    buttonVariants[variant],
    size === "sm" && "sm",
    fullWidth && "w",
    className,
  );
}

type ButtonProps = ComponentPropsWithoutRef<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      size = "default",
      fullWidth = false,
      className,
      type = "button",
      ...props
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        className={buttonClasses({ variant, size, fullWidth, className })}
        {...props}
      />
    );
  },
);

type ButtonLinkProps = ComponentPropsWithoutRef<typeof Link> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
};

export function ButtonLink({
  variant = "primary",
  size = "default",
  fullWidth = false,
  className,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={buttonClasses({ variant, size, fullWidth, className })}
      {...props}
    />
  );
}
