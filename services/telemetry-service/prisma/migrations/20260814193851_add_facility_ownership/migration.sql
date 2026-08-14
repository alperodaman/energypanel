-- CreateTable
CREATE TABLE "FacilityOwnership" (
    "facilityId" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FacilityOwnership_pkey" PRIMARY KEY ("facilityId")
);

-- CreateIndex
CREATE INDEX "FacilityOwnership_ownerUserId_idx" ON "FacilityOwnership"("ownerUserId");
