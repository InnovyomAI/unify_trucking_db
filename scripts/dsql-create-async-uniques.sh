#!/bin/zsh
set -euo pipefail

# Usage:
#   ./scripts/dsql-create-async-uniques.sh <ENDPOINT> <REGION> [SCHEMA]
# Example:
#   ./scripts/dsql-create-async-uniques.sh 3uab...on.aws us-east-1 unify_trucking

if [ $# -lt 2 ]; then
  echo "Usage: $0 <ENDPOINT> <REGION> [SCHEMA]" >&2
  exit 1
fi

ENDPOINT="$1"
REGION="$2"
SCHEMA="${3:-unify_trucking}"

for cmd in aws psql; do
  command -v "$cmd" >/dev/null 2>&1 || { echo "Missing dependency: $cmd" >&2; exit 1; }
done

echo "Generating DbConnect token for unify_prisma…"
TOKEN="$(aws dsql generate-db-connect-auth-token --region "$REGION" --expires-in 3600 --hostname "$ENDPOINT")"

echo "Creating UNIQUE indexes asynchronously in schema: $SCHEMA"
PGPASSWORD="$TOKEN" psql \
  --host="$ENDPOINT" --port=5432 --username=unify_prisma --dbname=postgres --set=sslmode=require <<SQL
-- 1:1 User ↔ DriverProfile
CREATE UNIQUE INDEX ASYNC IF NOT EXISTS "uniq_driver_userId"
  ON "$SCHEMA"."DriverProfile"("userId");

-- One profile per license (jurisdiction + normalized license)
CREATE UNIQUE INDEX ASYNC IF NOT EXISTS "uniq_driver_license"
  ON "$SCHEMA"."DriverProfile"("issuingJurisdiction", "licenseNoNorm");

-- Identity uniques
CREATE UNIQUE INDEX ASYNC IF NOT EXISTS "uniq_driver_email"
  ON "$SCHEMA"."DriverProfile"("email");

CREATE UNIQUE INDEX ASYNC IF NOT EXISTS "uniq_driver_phone"
  ON "$SCHEMA"."DriverProfile"("phone");

CREATE UNIQUE INDEX ASYNC IF NOT EXISTS "uniq_driver_qrid"
  ON "$SCHEMA"."DriverProfile"("qrid");

-- User email unique
CREATE UNIQUE INDEX ASYNC IF NOT EXISTS "uniq_user_email"
  ON "$SCHEMA"."User"("email");

-- One language per driver per code
CREATE UNIQUE INDEX ASYNC IF NOT EXISTS "uniq_language_driver_lang"
  ON "$SCHEMA"."LanguageSkill"("driverId", "langCode");
SQL

echo ""
echo "Recent async jobs:"
PGPASSWORD="$TOKEN" psql \
  --host="$ENDPOINT" --port=5432 --username=unify_prisma --dbname=postgres --set=sslmode=require \
  -c "SELECT job_id, status, object_name, details, start_time, update_time FROM sys.jobs ORDER BY start_time DESC LIMIT 20;"
