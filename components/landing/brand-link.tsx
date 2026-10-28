import Link from "next/link";

type BrandLinkProps = {
  href?: string;
  className?: string;
  label?: string;
};

export function BrandLink({
  href = "/",
  className = "brand",
  label = "ScanReview home",
}: BrandLinkProps) {
  return (
    <Link href={href} className={className} aria-label={label}>
      <span className="mark" aria-hidden="true">
        ★
      </span>
      ScanReview
    </Link>
  );
}
