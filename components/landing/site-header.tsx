import Link from "next/link";
import { BrandLink } from "./brand-link";
import { ThemeToggle } from "./theme-toggle";

export function SiteHeader() {
  return (
    <header className="wrap top" id="top">
      <BrandLink href="/" />
      <nav className="nav" aria-label="Primary">
        <ThemeToggle />
        <Link className="btn gh sm hs" href="/login">
          Log in
        </Link>
        <Link className="btn pri sm" href="/login#signup">
          Get started
        </Link>
      </nav>
    </header>
  );
}
