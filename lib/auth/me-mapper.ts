import type { AuthMeData, AuthMeMembership, AuthMeUser } from "@/types/auth-me";

export type SupabaseAuthUser = {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
};

export type MemberRoleLiteral = "ADMIN" | "MANAGER";

export type MemberWithOrganizationDto = {
  id: string;
  role: MemberRoleLiteral;
  organization: {
    id: string;
    name: string;
  };
};

export function mapSupabaseUser(user: SupabaseAuthUser): AuthMeUser {
  const meta = user.user_metadata ?? {};
  const fullName =
    typeof meta.full_name === "string"
      ? meta.full_name
      : typeof meta.name === "string"
        ? meta.name
        : null;

  return {
    id: user.id,
    email: user.email ?? null,
    fullName,
  };
}

export function buildAuthMeData(
  user: SupabaseAuthUser,
  member: MemberWithOrganizationDto | null,
): AuthMeData {
  const mappedUser = mapSupabaseUser(user);
  if (!member) {
    return {
      user: mappedUser,
      membership: null,
      onboardingRequired: true,
    };
  }

  const membership: AuthMeMembership = {
    id: member.id,
    role: member.role,
    organization: {
      id: member.organization.id,
      name: member.organization.name,
    },
  };

  return {
    user: mappedUser,
    membership,
    onboardingRequired: false,
  };
}
