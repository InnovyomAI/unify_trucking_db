#!/bin/zsh
ENDPOINT="3uabuhlurvlbz2tjhtsuomhrdy.dsql.us-east-1.on.aws"
REGION="us-east-1"

TOKEN=$(aws dsql generate-db-connect-auth-token \
  --region "$REGION" --expires-in 3600 --hostname "$ENDPOINT")

ENCODED=$(printf '%s' "$TOKEN" | jq -sRr @uri)

DATABASE_URL="postgresql://unify_prisma:${ENCODED}@${ENDPOINT}:5432/postgres?schema=unify_trucking&sslmode=require" \
  npx prisma db push
