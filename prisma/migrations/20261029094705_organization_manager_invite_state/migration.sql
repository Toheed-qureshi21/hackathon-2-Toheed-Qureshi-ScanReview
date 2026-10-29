-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "inviteAcceptedAt" TIMESTAMP(3),
ADD COLUMN     "inviteExpiresAt" TIMESTAMP(3),
ADD COLUMN     "inviteSentAt" TIMESTAMP(3);
