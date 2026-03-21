# Ads overview

This skill generates **app-owned** ad scaffolds for Apps-in-Toss miniapps.

Principles:
- runtime-first structure
- shared runtime config per app
- ad-type-specific service modules
- explicit failure handling
- deterministic telemetry and submission config

Generated outputs typically include:
- `src/config/ads.ts`
- `src/ads/<runtime>/runtime.ts`
- `src/ads/<runtime>/telemetry.ts`
- `src/ads/<runtime>/<type>/...`

The generator is intentionally conservative:
- it refuses to overwrite files unless `--force` is passed
- it writes TODO placeholders for unknown production IDs
- it does not mutate existing screens for you
