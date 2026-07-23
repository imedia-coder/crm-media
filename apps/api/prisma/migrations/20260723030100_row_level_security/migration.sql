-- Row-Level Security: tenant isolation.
-- Applied to every table that carries a tenantId column directly.
-- Child tables without their own tenantId (quote_lines, invoice_lines,
-- document_versions, deal_stage_history, task_dependencies, permissions,
-- payments) are protected transitively: they are only ever queried through
-- their tenant-scoped parent (quote, invoice, document, deal, task, role,
-- invoice) in application code. If they are ever queried directly, add a
-- tenantId column and a policy here first.

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'tenants', 'users', 'roles', 'companies', 'contacts', 'pipeline_stages',
    'deals', 'projects', 'tasks', 'time_entries', 'documents', 'quotes', 'invoices'
  ]
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;

-- The "tenants" table itself is keyed by id, not tenantId.
-- ids are Prisma-generated uuid() strings stored as TEXT, so compare as text.
-- Creating a tenant (signup) happens before any tenant context exists, so
-- INSERT is allowed unconditionally; reads/writes to an existing tenant row
-- stay scoped to the current tenant context.
CREATE POLICY tenant_isolation_read ON "tenants"
  FOR SELECT USING (id = current_setting('app.tenant_id', true));
CREATE POLICY tenant_isolation_write ON "tenants"
  FOR UPDATE USING (id = current_setting('app.tenant_id', true));
CREATE POLICY tenant_isolation_delete ON "tenants"
  FOR DELETE USING (id = current_setting('app.tenant_id', true));
CREATE POLICY tenant_isolation_insert ON "tenants"
  FOR INSERT WITH CHECK (true);

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'users', 'roles', 'companies', 'contacts', 'pipeline_stages',
    'deals', 'projects', 'tasks', 'time_entries', 'documents', 'quotes', 'invoices'
  ]
  LOOP
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I USING ("tenantId" = current_setting(''app.tenant_id'', true))',
      t
    );
  END LOOP;
END $$;

-- The application sets app.tenant_id at the start of every request
-- (see apps/api/src/core/tenants/tenant-context middleware, Task 3).
-- A separate DB role used for platform-level support/admin tooling should
-- bypass RLS via BYPASSRLS rather than by widening these policies.
