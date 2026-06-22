# MYIMUN — Backend & Deployment

The app is a single **Next.js** server (frontend + API routes) backed by
**Prisma + SQLite**. The database is one file (`prisma/data/app.db`) — in
production it lives on a Docker volume so it survives redeploys.

## Local development

```bash
npm install
cp .env.example .env          # then edit JWT_SECRET
npm run db:migrate            # creates prisma/data/app.db
npm run db:seed               # demo data + accounts
npm run dev                   # http://localhost:3000
```

**Demo accounts** (from the seed):
- Admin — `admin@myimun.org` / `admin123`
- Delegate — `delegate@myimun.org` / `delegate123`

Useful scripts: `db:generate`, `db:push`, `db:migrate`, `db:seed`, `db:studio`, `db:reset`.

## Production on a Hostinger VPS (Docker)

> Requires a **VPS** (KVM) plan with Docker — shared/cloud hosting cannot run a Node server.

```bash
# on the VPS, in the project folder
cp .env.example .env
nano .env                     # set a strong JWT_SECRET (openssl rand -base64 48)
docker compose up -d --build
```

This builds the standalone image, runs `prisma migrate deploy`, seeds on first
boot (if empty), and serves on **port 3000**. The SQLite DB + uploaded files
persist in the `myimun-data` Docker volume.

### HTTPS / domain (Caddy reverse proxy)

The simplest path to automatic HTTPS — create a `Caddyfile`:

```
your-domain.com {
    reverse_proxy localhost:3000
}
```

```bash
docker run -d --network host -v $PWD/Caddy​file:/etc/caddy/Caddyfile \
  -v caddy_data:/data caddy
```

Point your domain's A record at the VPS IP; Caddy fetches a Let's Encrypt cert automatically.

## Backups

The whole database is one file. Back it up by copying it out of the volume:

```bash
docker compose cp web:/app/prisma/data/app.db ./backup-$(date +%F).db
```

## Switching to Postgres later

Change the `datasource` provider in `prisma/schema.prisma` to `postgresql`,
set `DATABASE_URL` to your Postgres connection string, then
`npx prisma migrate dev`. The application code does not change.

## API surface (all under `/api`)

| Area | Routes |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` |
| Files | `POST /files`, `GET /files/:key` |
| Registrations | `GET/POST /registrations`, `PATCH /registrations/:id` |
| Payments | `GET/POST /payments`, `PATCH /payments/:id` |
| Position Papers | `GET/POST /papers`, `PATCH /papers/:id` |
| Committee Applications | `GET/POST /applications`, `PATCH /applications/:id` |
| Config (read) | `GET /committees`, `GET /events`, `GET /packages`, `GET /schedule` |
| Settings | `GET /settings/:key`, `PUT /settings/:key` (`payment`|`conference`|`landing`) |

Auth is a JWT in an httpOnly cookie. Delegate routes scope to the caller;
admin/secretary/manager roles unlock the staff actions.
