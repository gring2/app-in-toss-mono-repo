# TDS UI Contract (Apps-in-Toss)

## Goal
Use `@toss/tds-react-native` as the default UI system for every user-facing screen to maximize Toss review compatibility and UX consistency.

## Hard Rules
1. `src/pages/**` must use TDS components for visible UI controls/text.
2. Prefer TDS components over custom-styled equivalents.
3. Raw `react-native` UI primitives are allowed only for layout/media wrappers:
   - `SafeAreaView`, `ScrollView`, `View`, `Image`, `StyleSheet`
4. Do not use raw interaction primitives:
   - `Pressable`, `TouchableOpacity`, `TouchableHighlight`, `TouchableWithoutFeedback`
5. Do not use raw text/input/button primitives for new UI:
   - `Text`, `TextInput`, `Button` from `react-native`

## Required Screen States
Every new/changed user flow must define and implement:
- Loading state
- Empty state
- Error state

## Delivery Artifacts
Before implementation, provide:
1. `docs/tds-component-mapping.md` update (screen-to-component mapping)
2. UX copy/state notes for loading/empty/error

## PR Gate
Merge can proceed only when:
- `bash scripts/check-tds-usage.sh` passes
- Mapping doc is updated for changed screens
- Reviewer confirms no TDS contract violations
