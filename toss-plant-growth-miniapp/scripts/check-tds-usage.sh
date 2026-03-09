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

echo "[TDS Check] Validating TDS-first UI usage..."

if rg -n --glob '*.tsx' "TouchableOpacity|TouchableHighlight|TouchableWithoutFeedback|Pressable" src/pages src/components >/tmp/tds-touchables.log 2>/dev/null; then
  fail "raw RN touch interaction primitives are not allowed"
  cat /tmp/tds-touchables.log
else
  pass "no raw RN touch interaction primitives found"
fi

if rg -n --glob '*.tsx' "import\\s*\\{[^}]*\\b(Text|TextInput|Button|Pressable|TouchableOpacity|TouchableHighlight|TouchableWithoutFeedback)\\b[^}]*\\}\\s*from\\s*['\\\"]react-native['\\\"]" src/pages src/components >/tmp/tds-rn-primitives.log 2>/dev/null; then
  fail "raw RN text/input/button primitives are not allowed in pages/components"
  cat /tmp/tds-rn-primitives.log
else
  pass "no raw RN text/input/button primitive imports found"
fi

missing_page_tds="$(rg --files-without-match --glob '*.tsx' "@toss/tds-react-native" src/pages || true)"
if [[ -n "$missing_page_tds" ]]; then
  fail "every page must import @toss/tds-react-native"
  printf "%s\n" "$missing_page_tds"
else
  pass "all pages import @toss/tds-react-native"
fi

missing_component_tds="$(rg --files-without-match --glob '*.tsx' "@toss/tds-react-native" src/components || true)"
if [[ -n "$missing_component_tds" ]]; then
  fail "every shared UI component must import @toss/tds-react-native"
  printf "%s\n" "$missing_component_tds"
else
  pass "all shared UI components import @toss/tds-react-native"
fi

if [[ "$failures" -gt 0 ]]; then
  echo "[TDS Check] Completed with $failures failure(s)."
  exit 1
fi

echo "[TDS Check] All checks passed."
