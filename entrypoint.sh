#!/bin/sh
set -e

echo "========================================="
echo "=== FRENCH LMS - STARTING UP ==="
echo "========================================="
echo ""
echo "--- Environment Check ---"
echo "DATABASE_URL set: $(test -n "$DATABASE_URL" && echo YES || echo NO)"
echo "JWT_SECRET length: $(echo -n "$JWT_SECRET" | wc -c) characters"
echo "FRONTEND_URL: $FRONTEND_URL"
echo "PORT: ${PORT:-3000}"
echo "NODE_ENV: ${NODE_ENV:-not set}"
echo ""

echo "--- Running Prisma Migrations ---"
npx prisma migrate deploy 2>&1 || echo "WARNING: Prisma migrate failed!"
echo ""

echo "--- Starting NestJS Server ---"
exec node dist/main
