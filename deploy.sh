#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REMOTE_HOST="${REMOTE_HOST:-mellis.io}"
REMOTE_DIR="/var/www/casino"

echo "Building..."
cd "${SCRIPT_DIR}"
npm run build

echo "Deploying to ${REMOTE_HOST}:${REMOTE_DIR}/"
scp -r "${SCRIPT_DIR}/dist/"* "${REMOTE_HOST}:${REMOTE_DIR}/"

echo "Deploy complete: https://${REMOTE_HOST}/casino/"
