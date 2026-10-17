-- CreateEnum
CREATE TYPE "InvestmentType" AS ENUM ('SHARES', 'MUTUAL_FUND', 'SIP', 'BOND', 'FD', 'COMMODITY', 'LIC');

-- CreateEnum
CREATE TYPE "InvestmentStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'MATURED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Investment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "InvestmentType" NOT NULL,
    "name" TEXT NOT NULL,
    "status" "InvestmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "institution" TEXT,
    "symbol" TEXT,
    "policyNumber" TEXT,
    "investedAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "currentValue" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "quantity" DECIMAL(18,6),
    "purchasePrice" DECIMAL(14,4),
    "currentPrice" DECIMAL(14,4),
    "units" DECIMAL(18,6),
    "purchaseNav" DECIMAL(14,4),
    "currentNav" DECIMAL(14,4),
    "monthlyAmount" DECIMAL(14,2),
    "startDate" DATE,
    "nextPaymentDate" DATE,
    "interestRate" DECIMAL(5,2),
    "maturityDate" DATE,
    "premiumAmount" DECIMAL(14,2),
    "premiumFrequency" TEXT,
    "nextPremiumDate" DATE,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Investment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Investment_userId_type_idx" ON "Investment"("userId", "type");

-- CreateIndex
CREATE INDEX "Investment_userId_status_idx" ON "Investment"("userId", "status");

-- AddForeignKey
ALTER TABLE "Investment" ADD CONSTRAINT "Investment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
