ALTER TABLE "whatsapp_channels" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "whatsapp_channels" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "whatsapp_channels"
  USING ("tenantId" = current_setting('app.tenant_id', true));

ALTER TABLE "whatsapp_conversations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "whatsapp_conversations" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "whatsapp_conversations"
  USING ("tenantId" = current_setting('app.tenant_id', true));
