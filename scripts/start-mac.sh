#!/bin/bash
# Starts Plug (API + site) and opens the editor. Ctrl+C or closing the window stops everything.
# Optional keys in server/.env (KEY=value lines): ELEVENLABS_API_KEY, ANTHROPIC_API_KEY…
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"

if [ -f "$ROOT/server/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  . "$ROOT/server/.env"
  set +a
fi

cleanup() { kill "${API_PID:-}" "${WEB_PID:-}" 2>/dev/null || true; }
trap cleanup EXIT INT TERM HUP

NODE_V=$(node -v 2>/dev/null | tr -d v || true)
if [ -z "$NODE_V" ] || [ "$(printf '%s\n%s\n' 22.18 "$NODE_V" | sort -V | head -1)" != "22.18" ]; then
  echo "Plug demande Node.js 22.18 ou plus récent (trouvé : ${NODE_V:-aucun}). Relancez l'installation : scripts/install-mac.sh"
  exit 1
fi

# Ports: 8787 (API) and 5173 (site) unless another program already uses them.
port_busy() {
  if command -v lsof >/dev/null 2>&1; then lsof -nP -iTCP:"$1" -sTCP:LISTEN >/dev/null 2>&1
  else (exec 3<>"/dev/tcp/127.0.0.1/$1") 2>/dev/null; fi
}
free_port() {
  local p=$1
  while port_busy "$p"; do p=$((p + 1)); done
  echo "$p"
}
API_PORT=$(free_port "${PORT:-8787}")
WEB_PORT=$(free_port 5173)
[ "$API_PORT" = "${PORT:-8787}" ] || echo "Le port ${PORT:-8787} est pris par un autre programme : Plug utilise $API_PORT."

echo "Démarrage du serveur Plug…"
(cd "$ROOT/server" && PORT="$API_PORT" exec node src/index.ts) &
API_PID=$!
for _ in $(seq 1 30); do
  # Plug's own answer, not another program's.
  curl -fs "http://127.0.0.1:$API_PORT/api/health" 2>/dev/null | grep -q '"engineBuilt"' && break
  kill -0 "$API_PID" 2>/dev/null || { echo "Le serveur n'a pas démarré (voir les messages ci-dessus)."; exit 1; }
  sleep 1
done

echo "Démarrage du site…"
(cd "$ROOT/web" && PLUG_API="http://127.0.0.1:$API_PORT" exec ./node_modules/.bin/vite --host 127.0.0.1 --port "$WEB_PORT" --strictPort) &
WEB_PID=$!
for _ in $(seq 1 60); do
  curl -fs "http://127.0.0.1:$WEB_PORT/" >/dev/null 2>&1 && break
  kill -0 "$WEB_PID" 2>/dev/null || { echo "Le site n'a pas démarré (voir les messages ci-dessus)."; exit 1; }
  sleep 1
done

URL="http://127.0.0.1:$WEB_PORT/editeur"
# Chrome rather than the default browser: older Safari versions show a blank page.
open -a "Google Chrome" "$URL" 2>/dev/null || open -a Chromium "$URL" 2>/dev/null || open "$URL"
echo
echo "Plug tourne : $URL"
echo "Laissez cette fenêtre ouverte. Pour arrêter : Ctrl+C ou fermez la fenêtre."
wait
