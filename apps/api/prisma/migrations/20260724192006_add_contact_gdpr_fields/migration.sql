-- AlterTable
ALTER TABLE "contacts" ADD COLUMN     "anonymizedAt" TIMESTAMP(3),
ADD COLUMN     "consentGivenAt" TIMESTAMP(3),
ADD COLUMN     "consentSource" TEXT,
ADD COLUMN     "marketingConsent" BOOLEAN NOT NULL DEFAULT false;
