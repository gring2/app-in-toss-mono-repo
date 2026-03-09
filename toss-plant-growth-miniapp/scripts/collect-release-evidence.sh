#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

timestamp="$(date -u +"%Y%m%dT%H%M%SZ")"
report_dir=".omx/reports/release-evidence-$timestamp"
log_dir="$report_dir/logs"
report_file="$report_dir/report.md"
failures=0

mkdir -p "$log_dir"

commands=(
  "bash -n scripts/check-tds-usage.sh scripts/validate-submission.sh scripts/collect-release-evidence.sh"
  "npm run lint:check"
  "test -s README.md && test -s SUBMISSION_CHECKLIST.md && test -s docs/workflow-rfc.md && test -s docs/templates/handoff-template.md && test -s docs/templates/submission-readiness-report-template.md"
  "npm run typecheck"
  "npm run test"
  "npm run build"
  "npm run tds:check"
  "npm run submission:check"
)

slugify() {
  printf "%s" "$1" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-+|-+$//g'
}

{
  echo "# Release Evidence Bundle"
  echo
  echo "- Generated (UTC): $timestamp"
  echo "- Repo: $(basename "$ROOT_DIR")"
  echo
  echo "## Command Results"
} >"$report_file"

for cmd in "${commands[@]}"; do
  slug="$(slugify "$cmd")"
  log_path="$log_dir/$slug.log"

  if eval "$cmd" >"$log_path" 2>&1; then
    status="PASS"
  else
    status="FAIL"
    failures=$((failures + 1))
  fi

  {
    echo "- [$status] \`$cmd\`"
    echo "  - log: \`$log_path\`"
  } >>"$report_file"
done

{
  echo
  echo "## Artifact"
} >>"$report_file"

if [[ -f "plant-growth-miniapp.ait" ]]; then
  artifact_time="$(date -r "plant-growth-miniapp.ait" +"%Y-%m-%d %H:%M:%S %Z")"
  {
    echo "- file: \`plant-growth-miniapp.ait\`"
    echo "- modified_at: $artifact_time"
  } >>"$report_file"
else
  echo "- file: missing (\`plant-growth-miniapp.ait\`)" >>"$report_file"
  failures=$((failures + 1))
fi

{
  echo
  echo "## Manual Evidence Placeholders"
  echo "- Sandbox smoke test video/screenshot:"
  echo "- Ad ready/not-ready/fail/skip path evidence:"
  echo "- Submission console screenshots:"
} >>"$report_file"

echo "Release evidence report: $report_file"

if [[ "$failures" -gt 0 ]]; then
  echo "Release evidence collection completed with $failures failure(s)."
  exit 1
fi

echo "Release evidence collection completed successfully."
