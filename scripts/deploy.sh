#!/usr/bin/env bash
# Deploy Crown & Anchor from this repo to the live service.
# Live site: https://crownandanchor.online (nginx -> pm2 crown-anchor on 127.0.0.1:55555)
# The static handler serves files by path and ignores query strings for root,
# and index.html pins ?v=<stamp> on style.css/script.js, so the stamp MUST be
# bumped on every deploy or browsers keep serving the cached copy.
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET="${TARGET:-/opt/crown-anchor}"
STAMP="$(date -u +%Y%m%d%H%M%S)"

cd "$REPO_DIR"

# 1. stamp asset versions
python3 - "$STAMP" <<'PY'
import re, sys
stamp = sys.argv[1]
p = "index.html"
s = open(p).read()
s = re.sub(r'\?v=[0-9A-Za-z]+', '?v=' + stamp, s)
open(p, "w").write(s)
print(f"assets stamped ?v={stamp}")
PY

# 2. copy the served files
cp index.html style.css script.js server.js robots.txt sitemap.xml site.webmanifest \
   favicon.ico favicon-16x16.png favicon-32x32.png apple-touch-icon.png \
   og-share.jpg og-image.jpg "$TARGET"/

# 3. restart the process
pm2 restart crown-anchor >/dev/null 2>&1 || pm2 start server.js --name crown-anchor >/dev/null 2>&1

# 4. verify
sleep 2
code=$(curl -s -o /dev/null -w '%{http_code}' https://crownandanchor.online/)
img=$(curl -s -o /dev/null -w '%{http_code}' https://crownandanchor.online/og-share.jpg)
echo "live=$code og-image=$img"
[ "$code" = "200" ] || { echo "DEPLOY FAILED: site not 200"; exit 1; }