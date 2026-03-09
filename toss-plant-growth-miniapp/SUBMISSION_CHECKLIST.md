# Submission Checklist (오늘의 식물일기)

## 1) Console Value Fill

- [ ] `granite.config.ts`
  - [ ] `appName` matches console app name
  - [ ] `brand.displayName` approved
  - [ ] `brand.icon` is final production icon URL
- [ ] `src/config/ads.ts`
  - [ ] `captureReward` adGroupId set

## 2) Quality Gates

- [ ] `npm run lint:check`
- [ ] `npm run typecheck`
- [ ] `npm run test`
- [ ] `npm run build`
- [ ] `npm run tds:check`
- [ ] `npm run submission:check`
- [ ] `npm run submission:evidence`
- [ ] `docs/metrics-dashboard-plan.md` reviewed/attached

## 3) Artifact Verification

- [ ] `.ait` filename is `plant-growth-miniapp.ait`
- [ ] Artifact timestamp is latest build
- [ ] Sandbox smoke test pass (`intoss://plant-growth-miniapp`)
- [ ] Sandbox smoke test evidence attached (video/screenshots + deeplink launch)

## 4) Review Notes (for console submission form)

- Local-only data policy:
  - Data is stored locally and does not sync across devices.
- Permission rationale:
  - `camera`: take plant photos
  - `photos`: not requested (no gallery read/write flow)
- Ad behavior:
  - Reward-based ad used only in capture flow.
  - Slot unlock is no longer ad-gated.

## 5) Final Blockers (must be empty before submit)

- [ ] No placeholder values remain (`__SET_...`)
- [ ] No dev adGroupId (`ait.dev...`) in release path
- [ ] No `toss-todo-miniapp` reference remains in plant app release docs/config
- [ ] Submission readiness report created from `docs/templates/submission-readiness-report-template.md`
