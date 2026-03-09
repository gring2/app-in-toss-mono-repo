#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

failures=0

pass() {
  printf "PASS: %s\n" "$1"
}

fail() {
  printf "FAIL: %s\n" "$1"
  failures=$((failures + 1))
}

expect_match() {
  local message="$1"
  local pattern="$2"
  shift 2
  if rg -q "$pattern" "$@"; then
    pass "$message"
  else
    fail "$message"
  fi
}

expect_no_match() {
  local message="$1"
  local pattern="$2"
  shift 2
  if rg -q "$pattern" "$@"; then
    fail "$message"
  else
    pass "$message"
  fi
}

echo "[Submission Check] Validating release readiness for plant-growth-miniapp..."

expect_match "APP_NAME constant is set to plant-growth-miniapp" "const\\s+APP_NAME\\s*=\\s*[\"']plant-growth-miniapp[\"']" "granite.config.ts"
expect_match "granite appName uses APP_NAME constant" "appName:\\s*APP_NAME" "granite.config.ts"
expect_no_match "brand icon placeholder is replaced" "const\\s+BRAND_ICON_URL\\s*=\\s*[\"']__SET_BRAND_ICON_URL__[\"']" "granite.config.ts"
expect_no_match "capture adGroupId placeholder is replaced" "__SET_CAPTURE_REWARD_AD_GROUP_ID__" "src/config/ads.ts"
expect_no_match "capture adGroupId is not empty in production config" "captureReward:\\s*[\"']\\s*[\"']" "src/config/ads.ts"
expect_no_match "legacy toss-todo-miniapp references are removed" "toss-todo-miniapp" "granite.config.ts" "README.md" "package.json" "package-lock.json"
expect_no_match "dev adGroupId is not hardcoded in release screens" "ait\\.dev\\." "src/pages/index.tsx" "src/pages/capture.tsx"

if bash scripts/check-tds-usage.sh >/tmp/submission-tds-check.log 2>&1; then
  pass "TDS usage guardrail check passes"
else
  fail "TDS usage guardrail check fails"
  cat /tmp/submission-tds-check.log
fi

if [[ -f "docs/templates/handoff-template.md" ]]; then
  pass "handoff template exists"
else
  fail "handoff template is missing"
fi

if [[ -f "docs/templates/submission-readiness-report-template.md" ]]; then
  pass "submission readiness report template exists"
else
  fail "submission readiness report template is missing"
fi

if [[ -f "docs/metrics-dashboard-plan.md" ]]; then
  pass "metrics dashboard plan exists"
else
  fail "metrics dashboard plan is missing"
fi

if [[ -f "plant-growth-miniapp.ait" ]]; then
  pass "release artifact plant-growth-miniapp.ait exists"
else
  fail "release artifact plant-growth-miniapp.ait is missing"
fi

if [[ "$failures" -gt 0 ]]; then
  echo "[Submission Check] Completed with $failures failure(s)."
  exit 1
fi

echo "[Submission Check] All checks passed."
