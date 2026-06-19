#!/usr/bin/env bash
# Run ON mellis.io (or via setup-lobby.sh from your dev machine).
set -euo pipefail

LOBBY_DIR="/opt/casino-lobby"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUN_USER="${SUDO_USER:-mason}"

echo "==> Installing lobby server to ${LOBBY_DIR} (user: ${RUN_USER})..."
sudo mkdir -p "${LOBBY_DIR}/server" "${LOBBY_DIR}/shared"
sudo cp "${REPO_ROOT}/server/index.ts" "${LOBBY_DIR}/server/index.ts"
sudo cp "${REPO_ROOT}/shared/lobbyProtocol.ts" "${LOBBY_DIR}/shared/lobbyProtocol.ts"
sudo cp "${REPO_ROOT}/package.json" "${REPO_ROOT}/package-lock.json" "${LOBBY_DIR}/"
sudo chown -R "${RUN_USER}:${RUN_USER}" "${LOBBY_DIR}"

sudo -u "${RUN_USER}" bash -lc "cd '${LOBBY_DIR}' && npm ci --omit=dev"

NODE_BIN="$(sudo -u "${RUN_USER}" bash -lc 'command -v node')"
if [ -z "${NODE_BIN}" ] || [ ! -x "${NODE_BIN}" ]; then
  echo "ERROR: node not found for user ${RUN_USER}. Install Node.js or fix PATH."
  exit 1
fi

echo "==> Installing systemd service (node: ${NODE_BIN})..."
sudo tee /etc/systemd/system/casino-lobby.service > /dev/null <<EOF
[Unit]
Description=Grand Royale casino lobby WebSocket server
After=network.target

[Service]
Type=simple
User=${RUN_USER}
Group=${RUN_USER}
WorkingDirectory=${LOBBY_DIR}
Environment=NODE_ENV=production
Environment=LOBBY_PORT=8787
ExecStart=${NODE_BIN} ${LOBBY_DIR}/node_modules/tsx/dist/cli.mjs ${LOBBY_DIR}/server/index.ts
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable casino-lobby
sudo systemctl restart casino-lobby

echo "==> Configuring nginx WebSocket proxy..."
sudo mkdir -p /etc/nginx/snippets
sudo cp "${REPO_ROOT}/deploy/nginx-lobby-snippet.conf" /etc/nginx/snippets/casino-lobby-ws.conf

SITE=""
for f in /etc/nginx/sites-enabled/*; do
  if sudo grep -qE 'var/www/casino|location /casino' "$f" 2>/dev/null; then
    SITE="$f"
    break
  fi
done

if [ -z "${SITE}" ]; then
  echo "ERROR: Could not find an nginx site serving /casino/."
  echo "Manually add deploy/nginx-lobby-snippet.conf inside your mellis.io server { } block,"
  echo "then run: sudo nginx -t && sudo systemctl reload nginx"
  exit 1
fi

if ! sudo grep -q 'snippets/casino-lobby-ws.conf' "${SITE}"; then
  sudo sed -i '/server {/a \    include snippets/casino-lobby-ws.conf;' "${SITE}"
  echo "Added include to ${SITE}"
else
  echo "Nginx snippet already included in ${SITE}"
fi

sudo nginx -t
sudo systemctl reload nginx

echo ""
echo "==> Verifying..."
sleep 2
if curl -fsS http://127.0.0.1:8787/casino/lobby | grep -q 'Grand Royale'; then
  echo "Lobby server: OK (local)"
else
  echo "WARNING: Lobby server did not respond on 127.0.0.1:8787"
  sudo systemctl --no-pager status casino-lobby || true
  sudo journalctl -u casino-lobby -n 20 --no-pager
  exit 1
fi

if curl -fsS https://mellis.io/casino/lobby | grep -q 'Grand Royale'; then
  echo "Nginx proxy: OK (public)"
else
  echo "WARNING: Public https://mellis.io/casino/lobby check failed."
  echo "Check nginx config and try: curl -v https://mellis.io/casino/lobby"
  exit 1
fi

echo ""
echo "Lobby multiplayer is ready at wss://mellis.io/casino/lobby"