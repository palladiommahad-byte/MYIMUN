# ─────────────────────────────────────────────────────────────
# MYIMUN — production image (Next.js standalone + Prisma + SQLite)
# Build:  docker build -t myimun .
# Run:    docker compose up -d   (recommended — handles the data volume)
# ─────────────────────────────────────────────────────────────

# ---- deps: install all node_modules ----
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- builder: generate Prisma client + build Next ----
FROM node:20-alpine AS builder
RUN apk add --no-cache openssl
WORKDIR /app
# Dummy value so `prisma generate` can validate the datasource (no DB connection happens).
ENV DATABASE_URL="file:./prisma/data/app.db"
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# ---- runner: minimal standalone server ----
FROM node:20-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Prisma CLI (for `migrate deploy` at container start)
RUN npm i -g prisma@6.19.3 \
    && npm cache clean --force \
    && rm -rf /root/.npm /tmp/*

# The application and migration process do not need root privileges.
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 --ingroup nodejs nextjs

# Next.js standalone output
COPY --chown=nextjs:nodejs --from=builder /app/.next/standalone ./
COPY --chown=nextjs:nodejs --from=builder /app/.next/static ./.next/static
COPY --chown=nextjs:nodejs --from=builder /app/public ./public

# Prisma schema + migrations + generated client/engine
COPY --chown=nextjs:nodejs --from=builder /app/prisma ./prisma
COPY --chown=nextjs:nodejs --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --chown=nextjs:nodejs --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

COPY --chown=nextjs:nodejs docker-entrypoint.sh ./
RUN sed -i 's/\r$//' docker-entrypoint.sh \
    && chmod +x docker-entrypoint.sh \
    && mkdir -p prisma/data .next/cache \
    && chown -R nextjs:nodejs prisma/data .next/cache

EXPOSE 3000
USER nextjs
ENTRYPOINT ["./docker-entrypoint.sh"]
