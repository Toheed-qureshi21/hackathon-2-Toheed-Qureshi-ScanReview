import { BrandLink } from "@/components/ui/brand-link";
import { SiteNav } from "./site-nav";

export function SiteHeader() {
  return (
    <header className="wrap top" id="top">
      <BrandLink href="/" />
      <SiteNav />
    </header>
  );
}
