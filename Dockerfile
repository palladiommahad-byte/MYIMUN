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
RUN npm i -g prisma@6.19.3

# Next.js standalone output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Prisma schema + migrations + generated client/engine
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh && mkdir -p prisma/data

EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
