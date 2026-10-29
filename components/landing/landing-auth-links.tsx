"use client";

import Link from "next/link";

import { useLandingAuthCta } from "./use-landing-auth-cta";

export function LandingFooterAuthLinks() {
  const { signedIn, href } = useLandingAuthCta();

  if (signedIn) {
    return <Link href={href}>Dashboard</Link>;
  }

  return (
    <>
      <Link href="/auth/login">Log in</Link>
      <Link href="/auth/signup">Create your QR codes</Link>
    </>
  );
}
