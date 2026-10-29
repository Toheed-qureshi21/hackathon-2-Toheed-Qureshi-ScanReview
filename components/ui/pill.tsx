import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

type PillProps = ComponentPropsWithoutRef<"span">;

export function Pill({ className, ...props }: PillProps) {
  return <span className={cn("pill", className)} {...props} />;
}
