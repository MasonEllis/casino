#!/usr/bin/env bash
# One-time setup: installs the lobby server + nginx proxy on mellis.io.
# Run from your dev machine (Git Bash / WSL / macOS terminal).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REMOTE_HOST="${REMOTE_HOST:-mellis.io}"
REMOTE_STAGING="/tmp/casino-lobby-setup"

# shellcheck source=deploy/ssh-auth.sh
source "${SCRIPT_DIR}/deploy/ssh-auth.sh"
deploy_parse_password_arg "$@"
deploy_read_password "${REMOTE_HOST}"
deploy_ssh_auth_setup "${DEPLOY_PASSWORD}"
trap deploy_ssh_auth_teardown EXIT

echo "Uploading lobby server files to ${REMOTE_HOST}..."
deploy_ssh "${REMOTE_HOST}" "rm -rf ${REMOTE_STAGING} && mkdir -p ${REMOTE_STAGING}"
deploy_scp -r \
  "${SCRIPT_DIR}/server" \
  "${SCRIPT_DIR}/shared" \
  "${SCRIPT_DIR}/deploy" \
  "${SCRIPT_DIR}/package.json" \
  "${SCRIPT_DIR}/package-lock.json" \
  "${REMOTE_HOST}:${REMOTE_STAGING}"

echo "Running remote setup (requires sudo on server)..."
deploy_ssh -t "${REMOTE_HOST}" "cd ${REMOTE_STAGING} && sudo bash deploy/setup-lobby-server.sh"

echo ""
echo "Done. Redeploy the frontend with ./deploy.sh if needed."
