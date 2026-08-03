#!/usr/bin/env bash
set -Eeuo pipefail

cd /opt/myimun

if [[ -z "${APP_IMAGE:-}" ]]; then
    echo "APP_IMAGE is required" >&2
    exit 1
fi

compose=(docker compose --env-file .env -f docker-compose.yml)
previous_container="$("${compose[@]}" ps -q web 2>/dev/null || true)"
previous_image=""

if [[ -n "$previous_container" ]]; then
    previous_image="$(docker inspect --format '{{.Config.Image}}' "$previous_container" 2>/dev/null || true)"
    mkdir -p backups
    docker cp "$previous_container:/app/prisma/data/app.db" "backups/app-$(date -u +%Y%m%dT%H%M%SZ).db" 2>/dev/null || true
fi

rollback() {
    if [[ -n "$previous_image" ]]; then
        echo "Release failed; restoring $previous_image" >&2
        APP_IMAGE="$previous_image" "${compose[@]}" up -d --no-build --remove-orphans
    fi
}
trap rollback ERR

APP_IMAGE="$APP_IMAGE" "${compose[@]}" pull web
APP_IMAGE="$APP_IMAGE" "${compose[@]}" up -d --no-build --remove-orphans

for _ in {1..30}; do
    container="$(APP_IMAGE="$APP_IMAGE" "${compose[@]}" ps -q web)"
    status="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$container")"
    if [[ "$status" == "healthy" ]]; then
        trap - ERR
        docker image prune -f --filter 'until=168h' >/dev/null
        echo "Release healthy: $APP_IMAGE"
        exit 0
    fi
    if [[ "$status" == "unhealthy" || "$status" == "exited" || "$status" == "dead" ]]; then
        echo "Container entered $status state" >&2
        exit 1
    fi
    sleep 4
done

echo "Timed out waiting for a healthy application container" >&2
exit 1
