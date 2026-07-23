-- Provisions the non-BYPASSRLS role the application connects as at runtime
-- (RUNTIME_DATABASE_URL). Managed Postgres providers (Neon, Supabase...)
-- often grant BYPASSRLS to the default/owner role, which would silently
-- defeat every tenant_isolation policy above if the app connected as it.
--
-- No password is set here on purpose (never commit secrets to migration
-- history). After running this migration once per environment, set one:
--   ALTER ROLE app_runtime WITH PASSWORD '...';
-- or create/rotate it via your provider's role management UI (e.g. Neon's
-- "Roles" dashboard tab), then put the resulting connection string in
-- RUNTIME_DATABASE_URL.

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'app_runtime') THEN
    CREATE ROLE app_runtime LOGIN NOBYPASSRLS;
  END IF;
END $$;

DO $$
BEGIN
  EXECUTE format('GRANT CONNECT ON DATABASE %I TO app_runtime', current_database());
END $$;

GRANT USAGE ON SCHEMA public TO app_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_runtime;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_runtime;
