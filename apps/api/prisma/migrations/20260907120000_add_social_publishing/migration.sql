-- CreateEnum
CREATE TYPE "SocialNetwork" AS ENUM ('INSTAGRAM', 'FACEBOOK', 'TIKTOK');

-- CreateEnum
CREATE TYPE "SocialAccountStatus" AS ENUM ('PENDING', 'CONNECTED', 'ERROR');

-- CreateEnum
CREATE TYPE "SocialCapabilityKind" AS ENUM ('AUTO_PUBLISH', 'DRAFT_ONLY', 'MANUAL', 'UNVERIFIED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PublicationTargetStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'PUBLISHING', 'PUBLISHED', 'ACTION_REQUISE', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PublicationTargetMode" AS ENUM ('AUTO', 'DRAFT', 'MANUAL');

-- CreateEnum
CREATE TYPE "PublicationAttemptOutcome" AS ENUM ('OK', 'RETRY', 'FAILED');

-- CreateTable
CREATE TABLE "social_accounts" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "network" "SocialNetwork" NOT NULL,
    "externalId" TEXT,
    "handle" TEXT,
    "accessTokenEnc" TEXT,
    "refreshTokenEnc" TEXT,
    "scopes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tokenExpiresAt" TIMESTAMP(3),
    "status" "SocialAccountStatus" NOT NULL DEFAULT 'PENDING',
    "lastSyncAt" TIMESTAMP(3),
    "webhookSecret" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_account_capabilities" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "capability" "SocialCapabilityKind" NOT NULL DEFAULT 'UNVERIFIED',
    "reason" TEXT,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "social_account_capabilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "publications" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "contentItemId" TEXT,
    "campaignId" TEXT,
    "title" TEXT NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "scheduledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "publications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "publication_targets" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "publicationId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "network" "SocialNetwork" NOT NULL,
    "caption" TEXT,
    "hashtags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "mediaIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "PublicationTargetStatus" NOT NULL DEFAULT 'DRAFT',
    "mode" "PublicationTargetMode" NOT NULL DEFAULT 'AUTO',
    "scheduledAt" TIMESTAMP(3),
    "externalPostId" TEXT,
    "publishedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "publication_targets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "publication_attempts" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "outcome" "PublicationAttemptOutcome" NOT NULL,
    "errorCode" TEXT,
    "errorDetail" TEXT,
    "providerResponse" JSONB,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "publication_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_webhook_events" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "accountId" TEXT,
    "network" "SocialNetwork" NOT NULL,
    "externalEventId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "social_webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "social_accounts_webhookSecret_key" ON "social_accounts"("webhookSecret");

-- CreateIndex
CREATE INDEX "social_accounts_tenantId_idx" ON "social_accounts"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "social_accounts_companyId_network_key" ON "social_accounts"("companyId", "network");

-- CreateIndex
CREATE UNIQUE INDEX "social_account_capabilities_accountId_key" ON "social_account_capabilities"("accountId");

-- CreateIndex
CREATE INDEX "social_account_capabilities_tenantId_idx" ON "social_account_capabilities"("tenantId");

-- CreateIndex
CREATE INDEX "publications_tenantId_idx" ON "publications"("tenantId");

-- CreateIndex
CREATE INDEX "publications_scheduledAt_idx" ON "publications"("scheduledAt");

-- CreateIndex
CREATE INDEX "publication_targets_tenantId_idx" ON "publication_targets"("tenantId");

-- CreateIndex
CREATE INDEX "publication_targets_publicationId_idx" ON "publication_targets"("publicationId");

-- CreateIndex
CREATE INDEX "publication_targets_status_scheduledAt_idx" ON "publication_targets"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "publication_attempts_tenantId_idx" ON "publication_attempts"("tenantId");

-- CreateIndex
CREATE INDEX "publication_attempts_targetId_idx" ON "publication_attempts"("targetId");

-- CreateIndex
CREATE UNIQUE INDEX "social_webhook_events_externalEventId_key" ON "social_webhook_events"("externalEventId");

-- CreateIndex
CREATE INDEX "social_webhook_events_tenantId_idx" ON "social_webhook_events"("tenantId");

-- AddForeignKey
ALTER TABLE "social_accounts" ADD CONSTRAINT "social_accounts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_accounts" ADD CONSTRAINT "social_accounts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_account_capabilities" ADD CONSTRAINT "social_account_capabilities_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_account_capabilities" ADD CONSTRAINT "social_account_capabilities_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "social_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publications" ADD CONSTRAINT "publications_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publications" ADD CONSTRAINT "publications_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publications" ADD CONSTRAINT "publications_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "content_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publications" ADD CONSTRAINT "publications_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publication_targets" ADD CONSTRAINT "publication_targets_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publication_targets" ADD CONSTRAINT "publication_targets_publicationId_fkey" FOREIGN KEY ("publicationId") REFERENCES "publications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publication_targets" ADD CONSTRAINT "publication_targets_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "social_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publication_attempts" ADD CONSTRAINT "publication_attempts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publication_attempts" ADD CONSTRAINT "publication_attempts_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "publication_targets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_webhook_events" ADD CONSTRAINT "social_webhook_events_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_webhook_events" ADD CONSTRAINT "social_webhook_events_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "social_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
