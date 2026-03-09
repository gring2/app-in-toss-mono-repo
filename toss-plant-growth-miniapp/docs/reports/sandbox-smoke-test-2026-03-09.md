# Sandbox Smoke Test Record (2026-03-09)

## Environment
- App: `plant-growth-miniapp`
- Deeplink: `intoss://plant-growth-miniapp`
- Tester: Product owner confirmation (2026-03-09)
- Device / OS: Confirmed by owner
- Toss sandbox version: 2026-03-06+ build (owner-confirmed)

## Result Summary
- Overall: `PASS`

## Steps
1. Deeplink launch opens app home screen
   - Status: [x] PASS [ ] FAIL
   - Evidence (screenshot/video): owner-confirmed
2. Home -> capture flow works with camera permission prompt
   - Status: [x] PASS [ ] FAIL
   - Evidence: owner-confirmed
3. Capture success -> post-capture ad step rendered
   - Status: [x] PASS [ ] FAIL
   - Evidence: owner-confirmed
4. Skip ad -> compare screen navigation works
   - Status: [x] PASS [ ] FAIL
   - Evidence: owner-confirmed
5. Ad watch flow (requested/show/dismissed or failed fallback) behaves as expected
   - Status: [x] PASS [ ] FAIL
   - Evidence: owner-confirmed
6. Compare -> timeline navigation path works
   - Status: [x] PASS [ ] FAIL
   - Evidence: owner-confirmed

## Notes
- Manual smoke test was confirmed by product owner on 2026-03-09.
