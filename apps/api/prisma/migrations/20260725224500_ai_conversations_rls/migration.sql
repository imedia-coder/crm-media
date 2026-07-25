ALTER TABLE "ai_conversations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ai_conversations" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "ai_conversations"
  USING ("tenantId" = current_setting('app.tenant_id', true));
