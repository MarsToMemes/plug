#!/bin/bash
# Installs Plug on a Mac (Intel or Apple Silicon), without Homebrew.
# The repository is private: download this file from GitHub while signed in
# (MarsToMemes/plug → scripts/install-mac.sh → « Download raw file »), then:
#   bash ~/Downloads/install-mac.sh
# It signs in to GitHub with GitHub CLI (in the browser) to download Plug.
# Re-running it is safe: it only installs what is missing, then updates Plug.
# Puts Plug in ~/plug and a launcher on the Desktop (Plug.command).
set -euo pipefail

PLUG_DIR="${PLUG_DIR:-$HOME/plug}"
NODE_MIN="22.18"
say() { printf '\n\033[1m▸ %s\033[0m\n' "$1"; }
fail() { printf '\n\033[31m✗ %s\033[0m\n' "$1" >&2; exit 1; }
version_ge() { [ "$(printf '%s\n%s\n' "$2" "$1" | sort -V | head -1)" = "$2" ]; }

[ "$(uname)" = "Darwin" ] || fail "Ce script est pour macOS."
echo "Mac $(uname -m), macOS $(sw_vers -productVersion)"
version_ge "$(sw_vers -productVersion)" "12.0" || fail "Plug demande macOS 12 (Monterey) ou plus récent."

# 1. Git (outils en ligne de commande d'Apple)
if ! xcode-select -p >/dev/null 2>&1; then
  say "Installation des outils en ligne de commande d'Apple (Git)"
  echo "Une fenêtre va s'ouvrir : cliquez sur « Installer » et attendez la fin."
  xcode-select --install || true
  until xcode-select -p >/dev/null 2>&1; do sleep 10; done
fi
echo "✓ Git"

# 1 bis. GitHub CLI and sign-in: the repository is private
if ! command -v gh >/dev/null 2>&1; then
  say "Installation de GitHub CLI (votre mot de passe de session est demandé)"
  GH_V=$(curl -fsSI https://github.com/cli/cli/releases/latest/download/gh | awk -F/ 'tolower($1) ~ /^location/ {print $(NF-1)}' | tr -d 'v\r')
  [ -n "$GH_V" ] || fail "Impossible de trouver la dernière version de GitHub CLI. Installez-la depuis https://cli.github.com puis relancez ce script."
  curl -fL "https://github.com/cli/cli/releases/download/v$GH_V/gh_${GH_V}_macOS_universal.pkg" -o /tmp/gh.pkg
  sudo installer -pkg /tmp/gh.pkg -target /
  rm -f /tmp/gh.pkg
  export PATH="/usr/local/bin:$PATH"
fi
if ! gh auth status --hostname github.com >/dev/null 2>&1; then
  say "Connexion à votre compte GitHub"
  echo "Un code va s'afficher : appuyez sur Entrée, collez-le dans la page GitHub qui s'ouvre et validez."
  gh auth login --hostname github.com --git-protocol https --web </dev/tty
fi
gh auth setup-git --hostname github.com
echo "✓ GitHub ($(gh api user --jq .login 2>/dev/null || echo connecté))"

# 2. Node.js (installateur officiel, universel Intel / Apple Silicon)
NODE_OK=0
if command -v node >/dev/null 2>&1 && version_ge "$(node -v | tr -d v)" "$NODE_MIN"; then NODE_OK=1; fi
if [ "$NODE_OK" = 0 ]; then
  say "Installation de Node.js 22 (votre mot de passe de session est demandé)"
  PKG=$(curl -fsSL https://nodejs.org/dist/latest-v22.x/SHASUMS256.txt | awk '/\.pkg$/ {print $2}')
  [ -n "$PKG" ] || fail "Impossible de trouver l'installateur de Node.js sur nodejs.org."
  curl -fL "https://nodejs.org/dist/latest-v22.x/$PKG" -o "/tmp/$PKG"
  sudo installer -pkg "/tmp/$PKG" -target /
  rm -f "/tmp/$PKG"
  export PATH="/usr/local/bin:$PATH"
fi
echo "✓ Node.js $(node -v)"

# 3. FFmpeg complet (la planche de contrôle utilise le filtre drawtext)
if ! command -v ffmpeg >/dev/null 2>&1 || ! ffmpeg -hide_banner -filters 2>/dev/null | grep -q drawtext || ! command -v ffprobe >/dev/null 2>&1; then
  say "Installation de FFmpeg (votre mot de passe de session est demandé)"
  if [ "$(uname -m)" = "arm64" ]; then
    fail "Sur Apple Silicon, installez FFmpeg avec Homebrew (brew install ffmpeg), puis relancez ce script."
  fi
  TMP=$(mktemp -d)
  curl -fL https://evermeet.cx/ffmpeg/getrelease/zip -o "$TMP/ffmpeg.zip" \
    && curl -fL https://evermeet.cx/ffmpeg/getrelease/ffprobe/zip -o "$TMP/ffprobe.zip" \
    || fail "Téléchargement de FFmpeg impossible. Téléchargez ffmpeg et ffprobe sur https://evermeet.cx/ffmpeg/, copiez-les dans /usr/local/bin, puis relancez ce script."
  (cd "$TMP" && unzip -oq ffmpeg.zip && unzip -oq ffprobe.zip)
  sudo mkdir -p /usr/local/bin
  sudo mv -f "$TMP/ffmpeg" "$TMP/ffprobe" /usr/local/bin/
  sudo xattr -d com.apple.quarantine /usr/local/bin/ffmpeg /usr/local/bin/ffprobe 2>/dev/null || true
  rm -rf "$TMP"
  export PATH="/usr/local/bin:$PATH"
fi
echo "✓ FFmpeg"

# 4. Google Chrome (rendu des images)
if [ ! -d "/Applications/Google Chrome.app" ] && [ ! -d "/Applications/Chromium.app" ]; then
  say "Google Chrome manque"
  echo "Installez-le depuis https://www.google.com/chrome/ (la fenêtre va s'ouvrir), puis relancez ce script."
  open "https://www.google.com/chrome/" || true
  exit 1
fi
echo "✓ Chrome"

# 5. Plug
if [ -d "$PLUG_DIR/.git" ]; then
  say "Mise à jour de Plug dans $PLUG_DIR"
  git -C "$PLUG_DIR" pull --ff-only
  git -C "$PLUG_DIR" submodule update --init
else
  say "Téléchargement de Plug dans $PLUG_DIR"
  gh repo clone MarsToMemes/plug "$PLUG_DIR" -- --recurse-submodules
fi

say "Préparation du serveur et du moteur (plusieurs minutes)"
(cd "$PLUG_DIR/server" && npm install && npm run setup-engine)

say "Préparation du site"
(cd "$PLUG_DIR/web" && npm install)

# 6. Lanceur sur le Bureau
LAUNCHER="$HOME/Desktop/Plug.command"
cat > "$LAUNCHER" <<EOF
#!/bin/bash
exec "$PLUG_DIR/scripts/start-mac.sh"
EOF
chmod +x "$LAUNCHER" "$PLUG_DIR/scripts/start-mac.sh"

say "Plug est installé"
echo "Double-cliquez sur « Plug » sur votre Bureau pour le lancer (l’éditeur s’ouvre dans Google Chrome)."
# The keys file, created once from the template (never overwritten, never pushed to GitHub).
if [ ! -f "$PLUG_DIR/server/.env" ]; then cp "$PLUG_DIR/server/.env.example" "$PLUG_DIR/server/.env"; fi
echo "Clés (Claude, Runway, voix IA) : ouvrez le fichier des clés avec"
echo "  open -e \"$PLUG_DIR/server/.env\""
echo "collez chaque clé après son signe =, enregistrez (Cmd+S), puis relancez Plug."
