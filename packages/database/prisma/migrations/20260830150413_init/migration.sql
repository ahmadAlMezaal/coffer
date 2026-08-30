-- CreateEnum
CREATE TYPE "ConsentStatus" AS ENUM ('processing', 'active', 'reauth_required', 'revoked');

-- CreateEnum
CREATE TYPE "Direction" AS ENUM ('in', 'out');

-- CreateEnum
CREATE TYPE "SyncRunStatus" AS ENUM ('running', 'succeeded', 'failed');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_consents" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'plaid',
    "providerItemId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "institutionId" TEXT,
    "institutionName" TEXT,
    "status" "ConsentStatus" NOT NULL DEFAULT 'processing',
    "syncCursor" TEXT,
    "consentedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_consents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" UUID NOT NULL,
    "accessConsentId" UUID NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mask" TEXT,
    "type" TEXT NOT NULL,
    "subtype" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "currentBalance" DECIMAL(14,2) NOT NULL,
    "availableBalance" DECIMAL(14,2),
    "balanceAsOf" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" UUID NOT NULL,
    "accountId" UUID NOT NULL,
    "providerTransactionId" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "direction" "Direction" NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "bookedAt" DATE NOT NULL,
    "description" TEXT NOT NULL,
    "merchantName" TEXT,
    "category" TEXT,
    "paymentMethod" TEXT,
    "isInternalTransfer" BOOLEAN NOT NULL DEFAULT false,
    "internalTransferPairId" UUID,
    "removedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "raw_provider_payloads" (
    "id" UUID NOT NULL,
    "accessConsentId" UUID NOT NULL,
    "syncRunId" UUID,
    "provider" TEXT NOT NULL DEFAULT 'plaid',
    "endpoint" TEXT NOT NULL,
    "requestCursor" TEXT,
    "responseBody" JSONB NOT NULL,
    "responseHash" TEXT NOT NULL,
    "httpStatus" INTEGER NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "raw_provider_payloads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stats_snapshots" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "periodStart" DATE NOT NULL,
    "periodEnd" DATE NOT NULL,
    "totalBalance" DECIMAL(14,2) NOT NULL,
    "monthlyInflow" DECIMAL(14,2) NOT NULL,
    "monthlyOutflow" DECIMAL(14,2) NOT NULL,
    "netBurn" DECIMAL(14,2) NOT NULL,
    "runwayDays" INTEGER,
    "cashZeroAt" DATE,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stats_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_runs" (
    "id" UUID NOT NULL,
    "accessConsentId" UUID NOT NULL,
    "workflowId" TEXT NOT NULL,
    "status" "SyncRunStatus" NOT NULL DEFAULT 'running',
    "transactionsAdded" INTEGER NOT NULL DEFAULT 0,
    "transactionsModified" INTEGER NOT NULL DEFAULT 0,
    "transactionsRemoved" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "sync_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "access_consents_providerItemId_key" ON "access_consents"("providerItemId");

-- CreateIndex
CREATE INDEX "access_consents_userId_idx" ON "access_consents"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_providerAccountId_key" ON "accounts"("providerAccountId");

-- CreateIndex
CREATE INDEX "accounts_accessConsentId_idx" ON "accounts"("accessConsentId");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_providerTransactionId_key" ON "transactions"("providerTransactionId");

-- CreateIndex
CREATE INDEX "transactions_accountId_bookedAt_idx" ON "transactions"("accountId", "bookedAt" DESC);

-- CreateIndex
CREATE INDEX "transactions_accountId_amount_bookedAt_idx" ON "transactions"("accountId", "amount", "bookedAt");

-- CreateIndex
CREATE INDEX "raw_provider_payloads_accessConsentId_receivedAt_idx" ON "raw_provider_payloads"("accessConsentId", "receivedAt" DESC);

-- CreateIndex
CREATE INDEX "raw_provider_payloads_responseHash_idx" ON "raw_provider_payloads"("responseHash");

-- CreateIndex
CREATE INDEX "stats_snapshots_userId_periodStart_idx" ON "stats_snapshots"("userId", "periodStart");

-- CreateIndex
CREATE INDEX "sync_runs_accessConsentId_idx" ON "sync_runs"("accessConsentId");

-- AddForeignKey
ALTER TABLE "access_consents" ADD CONSTRAINT "access_consents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_accessConsentId_fkey" FOREIGN KEY ("accessConsentId") REFERENCES "access_consents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_internalTransferPairId_fkey" FOREIGN KEY ("internalTransferPairId") REFERENCES "transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raw_provider_payloads" ADD CONSTRAINT "raw_provider_payloads_accessConsentId_fkey" FOREIGN KEY ("accessConsentId") REFERENCES "access_consents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raw_provider_payloads" ADD CONSTRAINT "raw_provider_payloads_syncRunId_fkey" FOREIGN KEY ("syncRunId") REFERENCES "sync_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stats_snapshots" ADD CONSTRAINT "stats_snapshots_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sync_runs" ADD CONSTRAINT "sync_runs_accessConsentId_fkey" FOREIGN KEY ("accessConsentId") REFERENCES "access_consents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
