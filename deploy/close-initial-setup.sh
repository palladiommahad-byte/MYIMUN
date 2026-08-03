#!/usr/bin/env bash
set -Eeuo pipefail

cd /opt/myimun
umask 077

new_token="$(openssl rand -base64 48 | tr -d '\n')"
temp_env="$(mktemp .env.rotate.XXXXXX)"

awk -v token="$new_token" '
    /^INITIAL_ADMIN_TOKEN=/ { print "INITIAL_ADMIN_TOKEN=" token; found=1; next }
    { print }
    END { if (!found) print "INITIAL_ADMIN_TOKEN=" token }
' .env > "$temp_env"

chmod 600 "$temp_env"
mv "$temp_env" .env

if [[ -f .initial-admin-token ]]; then
    shred --remove .initial-admin-token
fi

docker compose --env-file .env up -d --no-build web

for _ in {1..30}; do
    container="$(docker compose --env-file .env ps -q web)"
    status="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$container")"
    if [[ "$status" == "healthy" ]]; then
        echo "Initial setup credentials rotated and web container healthy."
        exit 0
    fi
    sleep 2
done

echo "Timed out waiting for the web container after setup-token rotation." >&2
exit 1
