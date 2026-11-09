#!/bin/bash
# Random-action ("monkey") test for DragonCraft. Usage: bash tests/run-monkey.sh [seed] [steps]
set -e
SEED="${1:-1}"; STEPS="${2:-300}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
TMP="$(mktemp -d)"
cp "$ROOT"/index.html "$ROOT"/questions.js "$ROOT"/game.js "$ROOT"/parent.js "$ROOT"/styles.css "$ROOT"/manifest.json "$ROOT"/icon-*.png "$TMP"/
cp "$ROOT"/tests/monkey.js "$TMP"/
sed 's#</body>#<script src="monkey.js"></script></body>#' "$TMP/index.html" > "$TMP/monkey.html"
"$CHROME" --headless=new --disable-gpu --user-data-dir="$TMP/profile" --window-size=1180,820 \
  --virtual-time-budget=3000000 --dump-dom "file://$TMP/monkey.html?seed=$SEED&steps=$STEPS" 2>/dev/null > "$TMP/dom.html"
python3 - "$TMP/dom.html" "$SEED" <<'PY'
import re, base64, json, sys
d = open(sys.argv[1]).read()
m = re.search(r'<title>MONKEY:([A-Za-z0-9+/=]+)</title>', d)
if not m:
    print(f'seed {sys.argv[2]}: NO RESULT (page did not finish)'); sys.exit(1)
o = json.loads(base64.b64decode(m.group(1)).decode('utf8'))
bad = o['violations'] or o['errors']
print(f"seed {o['seed']}: {o['steps']} steps, {len(o['violations'])} violations, {len(o['errors'])} JS errors | final {o.get('final')}")
if bad:
    for v in (o['violations'] + o['errors'])[:12]: print('   -', v)
print('   actions:', ', '.join(f'{k}={v}' for k, v in sorted(o['counts'].items())))
sys.exit(1 if bad else 0)
PY
