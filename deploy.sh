#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REMOTE_HOST="${REMOTE_HOST:-mellis.io}"
REMOTE_DIR="/var/www/casino"

# shellcheck source=deploy/ssh-auth.sh
source "${SCRIPT_DIR}/deploy/ssh-auth.sh"
deploy_parse_password_arg "$@"
deploy_read_password "${REMOTE_HOST}"
deploy_ssh_auth_setup "${DEPLOY_PASSWORD}"
trap deploy_ssh_auth_teardown EXIT

echo "Building..."
cd "${SCRIPT_DIR}"
npm run build

echo "Deploying to ${REMOTE_HOST}:${REMOTE_DIR}/"
deploy_scp -r "${SCRIPT_DIR}/dist/"* "${REMOTE_HOST}:${REMOTE_DIR}/"

REMOTE_LOBBY_DIR="/opt/casino-lobby"
echo "Deploying lobby server to ${REMOTE_HOST}:${REMOTE_LOBBY_DIR}/"
deploy_ssh "${REMOTE_HOST}" "sudo mkdir -p ${REMOTE_LOBBY_DIR}/server ${REMOTE_LOBBY_DIR}/shared"
deploy_scp "${SCRIPT_DIR}/server/index.ts" "${REMOTE_HOST}:/tmp/casino-lobby-index.ts"
deploy_scp "${SCRIPT_DIR}/shared/lobbyProtocol.ts" "${REMOTE_HOST}:/tmp/casino-lobby-protocol.ts"
deploy_scp "${SCRIPT_DIR}/package.json" "${SCRIPT_DIR}/package-lock.json" "${REMOTE_HOST}:/tmp/"
deploy_ssh "${REMOTE_HOST}" "sudo mv /tmp/casino-lobby-index.ts ${REMOTE_LOBBY_DIR}/server/index.ts && \
  sudo mv /tmp/casino-lobby-protocol.ts ${REMOTE_LOBBY_DIR}/shared/lobbyProtocol.ts && \
  sudo mv /tmp/package.json /tmp/package-lock.json ${REMOTE_LOBBY_DIR}/ && \
  sudo chown -R mason:mason ${REMOTE_LOBBY_DIR} && \
  sudo -u mason bash -lc 'cd ${REMOTE_LOBBY_DIR} && npm ci --omit=dev' && \
  sudo systemctl restart casino-lobby 2>/dev/null || echo 'Note: run ./setup-lobby.sh once to install the systemd service and nginx proxy.'"

echo "Deploy complete: https://${REMOTE_HOST}/casino/"
