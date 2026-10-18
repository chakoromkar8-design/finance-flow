-- CreateEnum
CREATE TYPE "InsuranceType" AS ENUM ('HEALTH', 'LIFE', 'TERM', 'VEHICLE', 'HOME', 'TRAVEL', 'OTHER');

-- CreateEnum
CREATE TYPE "InsuranceFrequency" AS ENUM ('MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "InsuranceStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED', 'PENDING');

-- CreateTable
CREATE TABLE "Insurance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "InsuranceType" NOT NULL,
    "provider" TEXT NOT NULL,
    "policyNumber" TEXT NOT NULL,
    "policyholder" TEXT NOT NULL,
    "coverageAmount" DECIMAL(14,2) NOT NULL,
    "premiumAmount" DECIMAL(14,2) NOT NULL,
    "frequency" "InsuranceFrequency" NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE,
    "renewalDate" DATE,
    "status" "InsuranceStatus" NOT NULL DEFAULT 'ACTIVE',
    "nominee" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Insurance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Insurance_userId_idx" ON "Insurance"("userId");

-- CreateIndex
CREATE INDEX "Insurance_userId_type_idx" ON "Insurance"("userId", "type");

-- CreateIndex
CREATE INDEX "Insurance_userId_status_idx" ON "Insurance"("userId", "status");

-- CreateIndex
CREATE INDEX "Insurance_userId_renewalDate_idx" ON "Insurance"("userId", "renewalDate");

-- AddForeignKey
ALTER TABLE "Insurance" ADD CONSTRAINT "Insurance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
