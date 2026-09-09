-- CreateTable
CREATE TABLE "subcontractors" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "personalAddress" TEXT,
    "personalPostalCode" TEXT,
    "personalCity" TEXT,
    "personalPhone" TEXT,
    "personalEmail" TEXT,
    "idDocumentNumber" TEXT,
    "idDocumentValidUntil" TIMESTAMP(3),
    "companyName" TEXT,
    "legalForm" TEXT,
    "siret" TEXT,
    "vatNumber" TEXT,
    "companyAddress" TEXT,
    "companyPostalCode" TEXT,
    "companyCity" TEXT,
    "companyPhone" TEXT,
    "companyEmail" TEXT,
    "bankAccountHolder" TEXT,
    "bankName" TEXT,
    "iban" TEXT,
    "bic" TEXT,
    "insuranceCompany" TEXT,
    "insurancePolicyNumber" TEXT,
    "insuranceValidUntil" TIMESTAMP(3),
    "hasLiabilityInsurance" BOOLEAN,
    "hasTenYearInsurance" BOOLEAN,
    "serviceType" TEXT,
    "dailyRate" DECIMAL(10,2),
    "interventionZone" TEXT,
    "availableFrom" TIMESTAMP(3),
    "experienceNotes" TEXT,
    "signedAt" TIMESTAMP(3),
    "signedLocation" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subcontractors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "subcontractors_tenantId_idx" ON "subcontractors"("tenantId");

-- AddForeignKey
ALTER TABLE "subcontractors" ADD CONSTRAINT "subcontractors_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subcontractors" ADD CONSTRAINT "subcontractors_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
