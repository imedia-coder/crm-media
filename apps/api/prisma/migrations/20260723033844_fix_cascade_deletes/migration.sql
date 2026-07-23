-- DropForeignKey
ALTER TABLE "deal_stage_history" DROP CONSTRAINT "deal_stage_history_stageId_fkey";

-- DropForeignKey
ALTER TABLE "deals" DROP CONSTRAINT "deals_stageId_fkey";

-- DropForeignKey
ALTER TABLE "invoices" DROP CONSTRAINT "invoices_companyId_fkey";

-- DropForeignKey
ALTER TABLE "quotes" DROP CONSTRAINT "quotes_companyId_fkey";

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "pipeline_stages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_stage_history" ADD CONSTRAINT "deal_stage_history_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "pipeline_stages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
