# TDS Component Mapping

> Update this file whenever user-facing screens change.
>
> Product framing note (2026-03-11): the app now positions **today's diary capture and current-detail noticing** as the main experience. Compare/change screens may still exist, but they are secondary legacy surfaces until follow-up redesign work lands.

## 1) Home (`src/pages/index.tsx`)
- Main structure: `List`, `ListRow`, `Button`, `Text` + custom preview shell (`View`) + result image (`Image`)
- Intent: direct users into one single plant camera flow from the app entry route
- Loading state: plant state hydration panel + permission check status
- Empty state: pre-capture guidance (`아직 미리보기가 없어요`)
- Error state: permission/capture/save failure panel
- Notes: renders the same single-camera experience as `/capture` for route parity

## 2) Capture (`src/pages/capture.tsx`)
- Main structure: `List`, `ListRow`, `Button`, `Text` + custom preview shell (`View`) + result image (`Image`)
- Intent: one single plant camera flow — take photo, generate fast post-shot filtered preview, then retake/save
- Loading state:
  - plant state hydration
  - camera permission check
  - capture in progress
  - preview processing (`보통 5초 안에 끝나요`)
  - save in progress
- Empty state: pre-capture preview guidance
- Error state:
  - permission denied
  - capture failure
  - unsupported/enhancement fallback
  - save failure
- Notes: Apps-in-Toss `openCamera` still opens the system camera, so the custom experience is implemented around the handoff; there is no documented live in-camera custom preview in this flow

## 3) Compare (`src/pages/compare.tsx`)
- Main structure: `List`, `ListRow`, `Button`, `Text`
- Intent: temporary secondary review surface for existing compare/report behavior; no longer the primary product promise
- Loading state: report loading title/body
- Empty state: unavailable/locked states
- Error state: scene mismatch confirm flow + fallback messages

## 4) Timeline (`src/pages/timeline.tsx`)
- Main structure: `List`, `ListRow`, `Button`, `Text`
- Intent: diary archive / photo library for past records
- Loading state: preparing title/body
- Empty state: unavailable state
- Error state: fallback copy in unavailable flow

## 5) Shared Components

### CompareSlider (`src/components/CompareSlider.tsx`)
- Uses TDS text + RN media/layout wrappers
- Interaction and controls must remain TDS-consistent when expanded
- Legacy note: support existing compare UI until diary/library-first redesign replaces it

---

## Mapping Template for New Screens

### `<screen name>` (`<path>`)
- Main structure:
- Loading state:
- Empty state:
- Error state:
- Notes (why any non-TDS usage is required):
