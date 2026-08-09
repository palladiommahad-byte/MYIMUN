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
backup_retention="${BACKUP_RETENTION:-3}"

if [[ ! "$backup_retention" =~ ^[1-9][0-9]*$ ]]; then
    echo "BACKUP_RETENTION must be a positive whole number" >&2
    exit 1
fi

disk_report() {
    local label="$1"
    echo "Disk usage $label:"
    df -h /
    docker system df || true
    du -sh backups 2>/dev/null || true
}

remove_stopped_app_containers() {
    local containers=()
    mapfile -t containers < <(docker container ls -aq \
        --filter 'label=com.docker.compose.project=myimun' \
        --filter 'status=exited')
    if ((${#containers[@]} > 0)); then
        docker container rm "${containers[@]}" >/dev/null
    fi
}

prune_old_app_images() {
    local keep_current="${1:-}"
    local keep_previous="${2:-}"
    local repository="${APP_IMAGE%:*}"
    local image

    while IFS= read -r image; do
        [[ -z "$image" || "$image" == '<none>:<none>' ]] && continue
        if [[ "$image" != "$keep_current" && "$image" != "$keep_previous" ]]; then
            docker image rm "$image" >/dev/null 2>&1 || true
        fi
    done < <(docker image ls "$repository" --format '{{.Repository}}:{{.Tag}}')

    docker image prune -f >/dev/null
}

compress_and_rotate_backups() {
    local keep_count="$1"
    local file
    local backup_files=()

    mkdir -p backups
    while IFS= read -r -d '' file; do
        gzip -1 -- "$file"
    done < <(find backups -maxdepth 1 -type f -name 'app-*.db' -print0)

    mapfile -t backup_files < <(
        find backups -maxdepth 1 -type f \( -name 'app-*.db' -o -name 'app-*.db.gz' \) \
            -printf '%T@ %p\n' | sort -nr | cut -d' ' -f2-
    )
    if ((${#backup_files[@]} > keep_count)); then
        for file in "${backup_files[@]:keep_count}"; do
            rm -f -- "$file"
        done
    fi
}

if [[ -n "$previous_container" ]]; then
    previous_image="$(docker inspect --format '{{.Config.Image}}' "$previous_container" 2>/dev/null || true)"
fi

disk_report 'before cleanup'
remove_stopped_app_containers
# The running image cannot be deleted; all older application release tags can.
prune_old_app_images '' "$previous_image"
compress_and_rotate_backups "$((backup_retention > 1 ? backup_retention - 1 : 1))"

if [[ -n "$previous_container" ]]; then
    backup_path="backups/app-$(date -u +%Y%m%dT%H%M%SZ).db"
    if docker cp "$previous_container:/app/prisma/data/app.db" "$backup_path" 2>/dev/null; then
        gzip -1 -- "$backup_path"
    else
        echo "Warning: database backup could not be created" >&2
    fi
    compress_and_rotate_backups "$backup_retention"
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
        # Keep the healthy release plus one immediate rollback image only.
        prune_old_app_images "$APP_IMAGE" "$previous_image"
        disk_report 'after cleanup'
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
