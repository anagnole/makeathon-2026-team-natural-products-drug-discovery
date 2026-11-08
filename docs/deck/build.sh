#!/usr/bin/env bash
# Rebuild deck.pdf from deck.html.
#
# Chrome headless is the renderer: it is already on this machine, it honours the
# @page size (13.333in x 7.5in = 16:9) and it loads the committed figures from
# ../../notebooks/figures straight off disk. Fonts are vendored in fonts/, so the
# build needs no network and renders the same next week as it did today.
set -euo pipefail
cd "$(dirname "$0")"
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
[ -x "$CHROME" ] || { echo "Chrome not found at: $CHROME (set CHROME=...)" >&2; exit 1; }
"$CHROME" --headless --disable-gpu --no-sandbox \
  --no-pdf-header-footer --virtual-time-budget=20000 \
  --print-to-pdf="$PWD/deck.pdf" "file://$PWD/deck.html" 2>/dev/null
echo "wrote $PWD/deck.pdf"
