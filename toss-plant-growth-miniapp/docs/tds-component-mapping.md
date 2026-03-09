# TDS Component Mapping

> Update this file whenever user-facing screens change.

## 1) Home (`src/pages/index.tsx`)
- Main structure: `List`, `ListRow`, `Tab`, `BottomSheet`, `TextField`, `Button`, `Text`
- Loading state: `homeCopy.loadingTitle`, `homeCopy.loadingBody`
- Empty state: onboarding/empty diary copy
- Error state: status panel (`List` + `ListRow`)

## 2) Capture (`src/pages/capture.tsx`)
- Main structure: `List`, `ListRow`, `Button`, `Text`
- Loading state: capture processing + ad processing text
- Empty state: N/A (action-first screen)
- Error state: error panel + permission/ad failure copy

## 3) Compare (`src/pages/compare.tsx`)
- Main structure: `List`, `ListRow`, `Button`, `Text`
- Loading state: report loading title/body
- Empty state: unavailable/locked states
- Error state: scene mismatch confirm flow + fallback messages

## 4) Timeline (`src/pages/timeline.tsx`)
- Main structure: `List`, `ListRow`, `Button`, `Text`
- Loading state: preparing title/body
- Empty state: unavailable state
- Error state: fallback copy in unavailable flow

## 5) Shared Components

### CompareSlider (`src/components/CompareSlider.tsx`)
- Uses TDS text + RN media/layout wrappers
- Interaction and controls must remain TDS-consistent when expanded

---

## Mapping Template for New Screens

### `<screen name>` (`<path>`)
- Main structure:
- Loading state:
- Empty state:
- Error state:
- Notes (why any non-TDS usage is required):
