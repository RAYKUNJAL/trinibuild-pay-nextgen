#!/usr/bin/env bash
# run-all.sh — run every WeFetePass k6 stress scenario in sequence.
# Exits non-zero on the first failing test so CI / dev catches regressions fast.

set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RESULTS_DIR="${SCRIPT_DIR}/results"
mkdir -p "${RESULTS_DIR}"

if ! command -v k6 >/dev/null 2>&1; then
  echo "ERROR: k6 not installed. See stress/README.md for install instructions." >&2
  exit 127
fi

run_test() {
  local name="$1"
  local file="$2"
  echo
  echo "================================================================"
  echo "  Running: ${name}"
  echo "  Script:  ${file}"
  echo "  Target:  ${BASE_URL}"
  echo "================================================================"
  if ! BASE_URL="${BASE_URL}" k6 run "${file}"; then
    echo "FAIL: ${name} exited non-zero" >&2
    exit 1
  fi
  echo "PASS: ${name}"
}

# Order matters: read flood first (warm caches), then bursty scans, then checkout
# (most destructive — touches DB), then the long broadcast job last.
run_test "discover read flood"     "${SCRIPT_DIR}/k6-discover.js"
run_test "scan flood (gate open)"  "${SCRIPT_DIR}/k6-scan.js"
run_test "checkout flood (drop)"   "${SCRIPT_DIR}/k6-checkout.js"
run_test "whatsapp broadcast"      "${SCRIPT_DIR}/k6-whatsapp-broadcast.js"

echo
echo "All stress scenarios passed. Summaries in ${RESULTS_DIR}/"
