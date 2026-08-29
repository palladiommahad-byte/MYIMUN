#!/usr/bin/env bash
set -Eeuo pipefail

cd /opt/myimun
umask 077

DOMAIN="${DOMAIN:-moroccanmun.org}"
ACME_EMAIL="${ACME_EMAIL:-}"
APP_IMAGE="${APP_IMAGE:-ghcr.io/palladiommahad-byte/myimun:latest}"

if [[ -z "$ACME_EMAIL" ]]; then
    echo "Set ACME_EMAIL to the certificate contact email." >&2
    exit 1
fi

if [[ -e .env ]]; then
    echo "/opt/myimun/.env already exists; refusing to overwrite production secrets." >&2
    exit 1
fi

jwt_secret="$(openssl rand -base64 48 | tr -d '\n')"
admin_token="$(openssl rand -base64 48 | tr -d '\n')"

cat > .env <<EOF
DOMAIN=$DOMAIN
ACME_EMAIL=$ACME_EMAIL
APP_IMAGE=$APP_IMAGE
DATABASE_URL=file:/app/prisma/data/app.db
JWT_SECRET=$jwt_secret
INITIAL_ADMIN_TOKEN=$admin_token
SESSION_DAYS=7
EOF
chmod 600 .env

printf '%s\n' "$admin_token" > .initial-admin-token
chmod 600 .initial-admin-token

echo "Production environment created at /opt/myimun/.env with mode 600."
echo "The initial admin token is stored in /opt/myimun/.initial-admin-token with mode 600."
