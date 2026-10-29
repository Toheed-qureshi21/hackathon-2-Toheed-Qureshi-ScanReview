import { AuthLayout } from "@/components/auth/auth-layout";

export default function AcceptInviteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthLayout>{children}</AuthLayout>;
}
