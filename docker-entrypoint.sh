#!/bin/sh
set -e

validate_secret() {
    name="$1"
    value="$2"

    if [ "${#value}" -lt 32 ]; then
        echo "ERROR: $name must contain at least 32 characters." >&2
        exit 1
    fi

    case "$value" in
        *change-me*|*changeme*|*replace-me*|*example*)
            echo "ERROR: $name still contains a placeholder value." >&2
            exit 1
            ;;
    esac
}

validate_secret "JWT_SECRET" "${JWT_SECRET:-}"
validate_secret "INITIAL_ADMIN_TOKEN" "${INITIAL_ADMIN_TOKEN:-}"

case "${SESSION_DAYS:-7}" in
    ''|*[!0-9]*)
        echo "ERROR: SESSION_DAYS must be a whole number from 1 to 30." >&2
        exit 1
        ;;
esac

if [ "${SESSION_DAYS:-7}" -lt 1 ] || [ "${SESSION_DAYS:-7}" -gt 30 ]; then
    echo "ERROR: SESSION_DAYS must be between 1 and 30." >&2
    exit 1
fi

echo "Applying database migrations..."
prisma migrate deploy

echo "Starting Next.js server on :${PORT:-3000}..."
exec node server.js
