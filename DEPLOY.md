# Production deployment — Hostinger VPS

This is a Dockerized Next.js application with a persistent SQLite database. It needs a Hostinger **VPS/KVM plan**; shared hosting cannot run Docker or a Next.js server.

## Before deploying

1. Point your domain's A record to the VPS IP.
2. Install Docker Engine and Docker Compose on the VPS.
3. Copy the project to the VPS, then create `.env` from `.env.example`.
4. Generate two different secrets and place them in `.env`:

```bash
openssl rand -base64 48  # JWT_SECRET
openssl rand -base64 48  # INITIAL_ADMIN_TOKEN
```

Never use the example secret values or commit `.env`.

## Start the app

```bash
docker compose up -d --build
docker compose ps
docker compose logs -f web
```

The app is deliberately bound to `127.0.0.1:3000`, so it is not exposed directly to the internet. Database migrations run automatically. No fictional accounts, delegates, events, prices, or payment details are inserted.

Open `https://your-domain.com/setup-admin` and create the first administrator with `INITIAL_ADMIN_TOKEN`. The setup route locks permanently after the first admin account is created. Then sign in and configure the real event, committees, registration settings, payment details, and landing-page text in `/admin` before opening registrations.

## HTTPS with Caddy

Create a `Caddyfile` beside `docker-compose.yml`:

```caddyfile
your-domain.com {
    reverse_proxy 127.0.0.1:3000
}
```

Run Caddy on the VPS host (or use an existing Hostinger-supported reverse proxy). It obtains and renews HTTPS certificates automatically. Do not expose port 3000 in a firewall rule; only allow ports 80 and 443.

## Backups and updates

Back up the SQLite database and uploaded files before each deployment:

```bash
docker compose cp web:/app/prisma/data/app.db ./backup-$(date +%F).db
```

For an update:

```bash
git pull
docker compose up -d --build
```

The `myimun-data` Docker volume persists across normal updates. Do not run `docker compose down -v` in production: it removes the database and uploaded files.
