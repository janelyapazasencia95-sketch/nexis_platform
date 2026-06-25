#!/bin/bash

cd /var/www/nexis/backend

mkdir -p backups/postgres

DB_NAME=$(grep '^DB_NAME=' .env | cut -d= -f2-)
DB_USER=$(grep '^DB_USER=' .env | cut -d= -f2-)
DB_PASS=$(grep '^DB_PASSWORD=' .env | cut -d= -f2-)
DB_HOST=$(grep '^DB_HOST=' .env | cut -d= -f2-)
DB_PORT=$(grep '^DB_PORT=' .env | cut -d= -f2-)

PGPASSWORD="$DB_PASS" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -F c -f backups/postgres/nexis_db_$(date +%Y%m%d_%H%M%S).dump

find backups/postgres -name "*.dump" -type f -mtime +7 -delete
