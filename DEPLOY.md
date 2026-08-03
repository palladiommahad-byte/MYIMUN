# MYIMUN Production Deployment

Production target:

- Domain: `moroccanmun.org`
- VPS: `209.74.88.143`
- OS: Ubuntu 24.04
- Runtime: Docker Compose, Caddy, Next.js, Prisma, SQLite
- Delivery: GitHub Actions -> GHCR -> SSH release

## DNS

Replace the Namecheap parking records with:

```text
Type   Host   Value          TTL
A      @      209.74.88.143  Automatic
CNAME  www    moroccanmun.org  Automatic
```

Both names must resolve correctly before Caddy can issue their TLS certificates.

## Initial Server Bootstrap

Create a dedicated Ed25519 deployment key. Add its public key through the first
root session, then execute `deploy/bootstrap-ubuntu.sh` with `PUBLIC_KEY` set.
The script installs Docker, creates the `deploy` user, enables a 2 GB swap file,
opens only SSH/HTTP/HTTPS, and starts Fail2ban.

Do not run `deploy/harden-ssh.sh` until a second terminal has successfully logged
in as `deploy` using the key. The hardening script disables root and password SSH.

Create `/opt/myimun/.env` using `deploy/create-production-env.sh`. It generates
independent 48-byte JWT and initial-admin secrets and sets mode `600`. Never copy
the local development `.env` to the VPS.

## GitHub Production Secrets

Create a GitHub environment named `production`, then add:

```text
VPS_HOST=209.74.88.143
VPS_PORT=22
VPS_USER=deploy
VPS_SSH_PRIVATE_KEY=<the complete dedicated private key>
VPS_KNOWN_HOSTS=<the verified ssh-keyscan line for the VPS>
```

The workflow in `.github/workflows/deploy.yml` builds an immutable image tagged
with the commit SHA. It sends only Compose/Caddy/release configuration over SSH,
pulls the image with a short-lived GitHub token, waits for a healthy container,
and restores the previous image if startup fails.

## First Administrator

Open `https://moroccanmun.org/setup-admin` and use the one-time token displayed by
`create-production-env.sh`. After administrator creation, rotate
`INITIAL_ADMIN_TOKEN` in `/opt/myimun/.env` to a fresh random value and restart:

```bash
cd /opt/myimun
docker compose up -d --no-build
```

## Operations

Check status and logs:

```bash
cd /opt/myimun
docker compose ps
docker compose logs --tail=200 web
docker compose logs --tail=200 caddy
curl -fsS https://moroccanmun.org/api/health
```

Each deployment copies the current SQLite database into `/opt/myimun/backups`
before replacing the application container. The live database and uploaded file
records stay in the `myimun-data` Docker volume. Never run `docker compose down -v`
unless permanent data deletion is intentional.
