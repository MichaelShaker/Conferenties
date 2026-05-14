#!/usr/bin/env sh
set -eu

PROJECT_NAME="${PROJECT_NAME:-conferenties-ci}"
DB_CONTAINER="${DB_CONTAINER:-${PROJECT_NAME}-mysql-1}"
DB_NAME="${DB_NAME:-conferenties}"
DB_USER="${DB_USER:-root}"
DB_PASSWORD="${DB_PASSWORD:-root}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
STAMP="$(date +%Y%m%d-%H%M%S)"
OUT_FILE="${BACKUP_DIR}/${DB_NAME}-${STAMP}.sql"

mkdir -p "$BACKUP_DIR"

docker exec "$DB_CONTAINER" sh -c "mysqldump -u${DB_USER} -p${DB_PASSWORD} --single-transaction --routines --triggers ${DB_NAME}" > "$OUT_FILE"

echo "Backup written to ${OUT_FILE}"
