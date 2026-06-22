#!/bin/sh
set -e

echo "→ Applying database migrations…"
prisma migrate deploy

# Seed once, only if the database is empty (no users yet).
if [ "${SEED_ON_START:-true}" = "true" ]; then
  USER_COUNT=$(node -e "import('@prisma/client').then(async ({PrismaClient})=>{const p=new PrismaClient();try{console.log(await p.user.count())}catch(e){console.log(0)}finally{await p.\$disconnect()}})" 2>/dev/null || echo 0)
  if [ "$USER_COUNT" = "0" ]; then
    echo "→ Empty database detected — seeding initial data…"
    # The seed imports TS; if tsx isn't present in the slim image this is skipped gracefully.
    npx --yes tsx prisma/seed.ts 2>/dev/null || echo "  (skipped seed — run 'npm run db:seed' manually if needed)"
  fi
fi

echo "→ Starting Next.js server on :${PORT:-3000}…"
exec node server.js
