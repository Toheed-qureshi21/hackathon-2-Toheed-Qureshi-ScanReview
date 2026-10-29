-- CreateTable
CREATE TABLE "Feedback" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "spotId" UUID NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Feedback_organizationId_createdAt_idx" ON "Feedback"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "Feedback_spotId_createdAt_idx" ON "Feedback"("spotId", "createdAt");

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_spotId_fkey" FOREIGN KEY ("spotId") REFERENCES "Spot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
