

## WORKING MEMORY
[2026-03-21T03:31:15.017Z] Ralph start: fixing dev server 404 at 192.168.35.2:5173 after ad env changes. Need context snapshot + PRD/test-spec before implementation due ralph planning gate.

[2026-03-21T03:36:01.308Z] Ralph status: implemented dev wrapper hardening for 404 (parcel serve + absolute entry + fixed cwd), build green, architect approved. Remaining blocker is stale externally-managed dev listeners that sandbox cannot replace; user must restart dev server to validate root URL.
[2026-03-21T03:37:35.618Z] Ralph blocked only on external stale dev listener replacement. Wrapper now resolves to: npx parcel serve /Users/jinwoopark/app-in-toss-test/marble-rullet/source/index.html --host 192.168.35.2 --port 5173 with cwd=/Users/jinwoopark/app-in-toss-test/marble-rullet/source and AIT_AD_ENV=test. User must restart spawned dev server for final runtime verification.
[2026-03-21T03:39:25.483Z] Ralph blocked after verification: granite dev now resolves to node scripts/run-parcel-with-ad-env.cjs test 192.168.35.2 5173 -> npx parcel serve /Users/jinwoopark/app-in-toss-test/marble-rullet/source/index.html --host 192.168.35.2 --port 5173 with cwd source. Need external restart of stale PIDs 19524 and 19458 for final runtime proof.
[2026-03-21T03:39:33.445Z] Ralph finalized as blocked on external restart. Verified code fix and build/typecheck; stale dev listeners from marble-rullet/source must be restarted outside sandbox to validate root URL.
[2026-03-21T10:43:49.687Z] Ralph evidence for TossAds bridge gating: build PASS, typecheck PASS, lint PASS (non-blocking indexOf infos only), Playwright static QA at /dist/web/index.html shows zero console errors after replacing direct TossAds isSupported gate with native bridge preflight.