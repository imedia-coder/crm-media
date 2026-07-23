-- Row-Level Security for tables added after the original RLS migration.
--
-- "appointments" was missed when the Planning module was added (real gap:
-- it has been running without tenant isolation at the DB level since then,
-- relying only on application code remembering to scope every query —
-- exactly the class of mistake RLS exists to make impossible). Fixing it
-- here alongside the new Marketing tables so it doesn't get missed again.

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'appointments', 'campaigns', 'content_items', 'media_assets'
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
