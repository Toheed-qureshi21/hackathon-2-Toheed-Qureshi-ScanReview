/*
  Warnings:

  - Added the required column `alertRecipient` to the `Organization` table without a default value. This is not possible if the table is not empty.
  - Added the required column `businessType` to the `Organization` table without a default value. This is not possible if the table is not empty.
  - Added the required column `labelPreset` to the `Organization` table without a default value. This is not possible if the table is not empty.
  - Added the required column `spotLabel` to the `Organization` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AlertRecipientMode" AS ENUM ('ADMIN', 'MANAGER_PENDING');

-- AlterTable
ALTER TABLE "Member" ADD COLUMN     "alertEmail" TEXT;

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "alertRecipient" "AlertRecipientMode" NOT NULL,
ADD COLUMN     "businessType" TEXT NOT NULL,
ADD COLUMN     "customLabel" TEXT,
ADD COLUMN     "labelPreset" TEXT NOT NULL,
ADD COLUMN     "pendingManagerEmail" TEXT,
ADD COLUMN     "pendingManagerName" TEXT,
ADD COLUMN     "publicReviewUrl" TEXT,
ADD COLUMN     "spotLabel" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Spot" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "number" INTEGER NOT NULL,
    "displayName" TEXT NOT NULL,
    "publicToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Spot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Spot_publicToken_key" ON "Spot"("publicToken");

-- CreateIndex
CREATE INDEX "Spot_organizationId_idx" ON "Spot"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Spot_organizationId_number_key" ON "Spot"("organizationId", "number");

-- AddForeignKey
ALTER TABLE "Spot" ADD CONSTRAINT "Spot_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
