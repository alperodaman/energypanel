-- CreateTable
CREATE TABLE "Reading" (
    "id" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "deviceType" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "metadata" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reading_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackedDevice" (
    "id" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "deviceType" TEXT NOT NULL,
    "targetTemperature" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrackedDevice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Reading_facilityId_deviceId_occurredAt_idx" ON "Reading"("facilityId", "deviceId", "occurredAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "TrackedDevice_deviceId_key" ON "TrackedDevice"("deviceId");

-- CreateIndex
CREATE INDEX "TrackedDevice_facilityId_idx" ON "TrackedDevice"("facilityId");
