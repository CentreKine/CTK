#!/usr/bin/env bash
set -euo pipefail

# Simple exporter: queries the API /_export endpoint and writes a timestamped backup
# Usage:
#   API_URL=https://clinic-finance-rdnz.onrender.com/api ./tools/export_db.sh

API="${API_URL:-https://clinic-finance-rdnz.onrender.com/api}"
TS="$(date -u +%Y%m%dT%H%M%SZ)"
OUT_DIR="backups"
OUT_FILE="$OUT_DIR/backup-full-${TS}.json"

mkdir -p "$OUT_DIR"

echo "Exporting from ${API}/_export to ${OUT_FILE}"
if ! curl -sS -f "${API}/_export" -o "${OUT_FILE}"; then
  echo "ERROR: failed to fetch ${API}/_export" >&2
  exit 1
fi

if command -v jq >/dev/null 2>&1; then
  if jq --sort-keys . "${OUT_FILE}" >/dev/null 2>&1; then
    echo "JSON valid"
  else
    echo "WARNING: exported JSON is invalid" >&2
  fi
else
  echo "Note: jq not installed; skipping JSON validation"
fi

sha256sum "${OUT_FILE}" > "${OUT_FILE}.sha256"

echo "Saved ${OUT_FILE}"
echo "SHA256:"; cat "${OUT_FILE}.sha256"
