#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="/opt/kun-touchgal/.env.production.local"
TYPE="${1:-}"
case "$TYPE" in
  daily|weekly|monthly|yearly|total) ;;
  *) echo "usage: $0 <daily|weekly|monthly|yearly|total>" >&2; exit 2 ;;
esac

TOKEN="$(sed -n 's/^PYTHON_API_SECRET="\(.*\)"/\1/p' "$ENV_FILE")"
if [ -z "$TOKEN" ]; then
  echo "PYTHON_API_SECRET missing" >&2
  exit 1
fi

HEALTHCHECK_URL="$(sed -n 's/^HEALTHCHECK_CRAWL_URL="\(.*\)"/\1/p' "$ENV_FILE")"

ping_healthcheck() {
  if [ -n "${HEALTHCHECK_URL}" ]; then
    curl -fsS -m 15 -o /dev/null "${HEALTHCHECK_URL}${1:-}" || true
  fi
}

LOCK="/tmp/kiriko-crawl-${TYPE}.lock"
exec 9>"$LOCK"
flock -n 9 || exit 0

echo "[$(date -Is)] crawl ${TYPE} start"
if RESPONSE="$(curl -fsS -m 900 -X POST \
  -H "X-Internal-Token: ${TOKEN}" \
  "http://127.0.0.1:8000/crawl/${TYPE}")"; then
  if printf '%s' "$RESPONSE" | grep -q '"skipped":true'; then
    exit 0
  fi
  printf '%s\n' "$RESPONSE"
  echo "[$(date -Is)] crawl ${TYPE} done"
  ping_healthcheck
else
  echo "[$(date -Is)] crawl ${TYPE} failed" >&2
  ping_healthcheck "/fail"
  exit 1
fi
