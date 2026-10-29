import "server-only";

import { prisma } from "@/lib/db/prisma";
import {
  buildAuthMeData,
  type MemberWithOrganizationDto,
  type SupabaseAuthUser,
} from "@/lib/auth/me-mapper";

export type { SupabaseAuthUser } from "@/lib/auth/me-mapper";
export { buildAuthMeData } from "@/lib/auth/me-mapper";

function mapMember(
  member: Awaited<ReturnType<typeof getMemberForUserId>>,
): MemberWithOrganizationDto | null {
  if (!member) return null;
  return {
    id: member.id,
    role: member.role as MemberWithOrganizationDto["role"],
    organization: {
      id: member.organization.id,
      name: member.organization.name,
    },
  };
}

export async function getAuthMePayload(user: SupabaseAuthUser) {
  const member = await getMemberForUserId(user.id);
  return buildAuthMeData(user, mapMember(member));
}

export async function getMemberForUserId(userId: string) {
  return prisma.member.findUnique({
    where: { userId },
    include: { organization: true },
  });
}

export type MemberWithOrganization = NonNullable<
  Awaited<ReturnType<typeof getMemberForUserId>>
>;
