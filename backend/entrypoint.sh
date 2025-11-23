#!/bin/sh

# Exit on error
set -e

# Run setup script and capture the output to a temporary file
# Also tee the output to stdout to see it in the logs
node dist/setup-db.js | tee /tmp/setup-output.log

# Check if the database is empty by inspecting the output
LOGS_ZERO=$(grep "mission_logs records: 0" /tmp/setup-output.log)
PLANS_ZERO=$(grep "mission_plans records: 0" /tmp/setup-output.log)

# If both tables have 0 records, and the backup file exists, restore it
if [ -n "$LOGS_ZERO" ] && [ -n "$PLANS_ZERO" ] && [ -f "gcs_db_backup.sql" ]; then
  echo "Database is empty, attempting to restore from backup..."
  
  # Convert the file to UTF-8 to avoid encoding issues with psql
  iconv -f UTF-16LE -t UTF-8 gcs_db_backup.sql > gcs_db_backup_utf8.sql
  
  # Use psql to restore the backup file.
  PGPASSWORD=lipad123 psql -h db -U postgres -d gcs_db -f gcs_db_backup_utf8.sql

  echo "Database restore complete."
fi

# Start the main application
echo "Starting server..."
node dist/index.js