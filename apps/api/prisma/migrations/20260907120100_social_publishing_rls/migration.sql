-- Row-Level Security pour les tables du socle de publication multi-réseaux
-- (Increment 1, cf. docs/CAHIER-DES-CHARGES-RESEAUX.md). Même politique que
-- partout ailleurs : isolation stricte par tenant, y compris pour le rôle
-- applicatif (FORCE), via app.tenant_id positionné par TenantPrismaService.

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'social_accounts',
    'social_account_capabilities',
    'publications',
    'publication_targets',
    'publication_attempts',
    'social_webhook_events'
  ]
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I USING ("tenantId" = current_setting(''app.tenant_id'', true))',
      t
    );
  END LOOP;
END $$;
