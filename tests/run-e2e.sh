#!/bin/bash
# Browser end-to-end test for DragonCraft (macOS + Google Chrome).
# Usage:  bash tests/run-e2e.sh
# Copies the game to a temp folder, injects tests/e2e.js, runs it in headless Chrome
# (with virtual time so the 60s break countdown etc. run instantly) and prints PASS/FAIL per check.
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
TMP="$(mktemp -d)"
cp "$ROOT"/index.html "$ROOT"/questions.js "$ROOT"/game.js "$ROOT"/parent.js "$ROOT"/styles.css "$ROOT"/manifest.json "$ROOT"/icon-*.png "$TMP"/
cp "$ROOT"/tests/e2e.js "$TMP"/
sed 's#</body>#<script src="e2e.js"></script></body>#' "$TMP/index.html" > "$TMP/e2e.html"
"$CHROME" --headless=new --disable-gpu --user-data-dir="$TMP/profile" --window-size=1180,820 \
  --virtual-time-budget=900000 --dump-dom "file://$TMP/e2e.html" 2>/dev/null > "$TMP/dom.html"
python3 - "$TMP/dom.html" <<'PY'
import re, base64, json, sys
d = open(sys.argv[1]).read()
m = re.search(r'<title>E2E:([A-Za-z0-9+/=]+)</title>', d)
if not m:
    print('No results were produced (page crashed?)'); sys.exit(1)
res = json.loads(base64.b64decode(m.group(1)).decode('utf8'))
for n, ok, det in res:
    print(('PASS ' if ok else 'FAIL ') + n + ('' if ok else '\n       -> ' + det))
bad = [r for r in res if not r[1]]
print(f'\n{len(res) - len(bad)}/{len(res)} passed')
sys.exit(1 if bad else 0)
PY
