ALTER TABLE "subcontractors" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "subcontractors" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "subcontractors"
  USING ("tenantId" = current_setting('app.tenant_id', true));
