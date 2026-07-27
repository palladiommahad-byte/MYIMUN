#!/bin/sh
set -e

echo "Applying database migrations..."
prisma migrate deploy

echo "Starting Next.js server on :${PORT:-3000}..."
exec node server.js
