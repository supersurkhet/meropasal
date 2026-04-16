#!/usr/bin/env bash
set -euo pipefail
ROOT="/Users/abhi/proj/personal/meropasal"
VIDEO="${ROOT}/meropasal-invoice-pay-demo.webm"
PROFILE="${HOME}/.agent-browser/meropasal-profile"
BASE="http://127.0.0.1:5173"

agent-browser close 2>/dev/null || true
agent-browser --profile "$PROFILE" record start "$VIDEO" "$BASE/dashboard"
agent-browser wait --load networkidle

agent-browser open "${BASE}/stock-import/new"
agent-browser wait --load networkidle
agent-browser 'click @e26'
agent-browser wait 600
agent-browser find text Abc click
agent-browser wait 400
agent-browser 'fill @e27' '3'
agent-browser 'fill @e28' '150'
agent-browser 'click @e56'
agent-browser wait --load networkidle
agent-browser wait 2000

agent-browser open "${BASE}/sales/new"
agent-browser wait --load networkidle
agent-browser snapshot -i > /tmp/snap-sales.txt
grep -E "Select customer|Select product|Record Sale|spinbutton" /tmp/snap-sales.txt | head -20 || true

CUST=$(grep 'button "Select customer' /tmp/snap-sales.txt | head -1 | sed -n 's/.*\[ref=\([^]]*\)\].*/\1/p')
PROD=$(grep 'button "Select product' /tmp/snap-sales.txt | head -1 | sed -n 's/.*\[ref=\([^]]*\)\].*/\1/p')
if [[ -n "${CUST}" ]]; then
  agent-browser "click @${CUST}"
  agent-browser wait 500
  agent-browser find text click 2>/dev/null | head -1 || true
fi

agent-browser open "${BASE}/invoices"
agent-browser wait --load networkidle
agent-browser wait 1500

agent-browser record stop
echo "Saved: ${VIDEO}"
