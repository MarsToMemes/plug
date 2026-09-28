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

echo "Démarrage du serveur Plug…"
(cd "$ROOT/server" && exec node src/index.ts) &
API_PID=$!
for _ in $(seq 1 30); do
  curl -fs http://127.0.0.1:8787/api/health >/dev/null 2>&1 && break
  kill -0 "$API_PID" 2>/dev/null || { echo "Le serveur n'a pas démarré (voir les messages ci-dessus)."; exit 1; }
  sleep 1
done

echo "Démarrage du site…"
(cd "$ROOT/web" && exec ./node_modules/.bin/vite --port 5173 --strictPort) &
WEB_PID=$!
for _ in $(seq 1 30); do
  curl -fs http://localhost:5173/ >/dev/null 2>&1 && break
  sleep 1
done

# Chrome rather than the default browser: older Safari versions show a blank page.
open -a "Google Chrome" "http://localhost:5173/editeur" 2>/dev/null || open -a Chromium "http://localhost:5173/editeur" 2>/dev/null || open "http://localhost:5173/editeur"
echo
echo "Plug tourne : http://localhost:5173/editeur"
echo "Laissez cette fenêtre ouverte. Pour arrêter : Ctrl+C ou fermez la fenêtre."
wait
