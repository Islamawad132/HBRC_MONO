#!/bin/sh
set -e

echo "Running database migrations..."
./api_node_modules/.bin/prisma migrate deploy

echo "Running database seed (if needed)..."
node dist/prisma/seed.js || echo "Seed already applied or skipped"

echo "Starting application..."
exec node dist/src/main
