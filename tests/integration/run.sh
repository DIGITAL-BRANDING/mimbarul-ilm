#!/usr/bin/env bash
# Applies stub + migrations to a throwaway database and runs the SQL integration tests.
# Requires a PostgreSQL 15+ server reachable with the PG* env vars (superuser). Does NOT touch Supabase.
set -euo pipefail
cd "$(dirname "$0")/../.."
DB="${TEST_DB:-mimbarul_test}"
psql -v ON_ERROR_STOP=1 -q -d postgres -c "drop database if exists ${DB}" -c "create database ${DB}"
for f in tests/integration/sql/00_supabase_stub.sql supabase/migrations/*.sql tests/integration/sql/10_rls_and_triggers.test.sql; do
  echo "--> $f"; psql -v ON_ERROR_STOP=1 -q -d "$DB" -f "$f" 2>&1 | grep -E "PASS|ERROR|FAIL|ALL INTEGRATION" || true
done
