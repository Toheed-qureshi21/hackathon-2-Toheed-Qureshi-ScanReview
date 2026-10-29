import Link from "next/link";
import { cn } from "@/lib/utils";

type BrandLinkProps = {
  href?: string;
  className?: string;
  label?: string;
};

export function BrandLink({
  href = "/",
  className,
  label = "ScanReview home",
}: BrandLinkProps) {
  return (
    <Link href={href} className={cn("brand", className)} aria-label={label}>
      <span className="mark" aria-hidden="true">
        ★
      </span>
      ScanReview
    </Link>
  );
}
