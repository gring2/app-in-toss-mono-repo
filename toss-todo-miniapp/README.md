# Plant Growth Diary Miniapp (React Native)

This project is a Granite-based React Native miniapp configured for Apps-in-Toss.

## Custom subagent workflow

Project-scoped Codex custom subagents live in [`../.codex/agents`](../.codex/agents) and the shared monorepo Toss miniapp rules live at [`../AGENTS.md`](../AGENTS.md).

## Included features

- Local-only plant growth records (no backend)
- First photo baseline + latest photo automatic comparison
- Home hero with `첫날 vs 오늘` slider
- Camera capture flow for baseline and daily photos
- Rewarded ad gate for HD export on compare screen

## Run locally

```bash
npm install
npm run dev
```

## Build `.ait` bundle

```bash
npm run build
```

## Open in Toss sandbox

Use this scheme in the sandbox app:

```text
intoss://toss-todo-miniapp
```

## Before real console registration

Update these values in `granite.config.ts` to match your Apps-in-Toss console app:

- `appName`
- `brand.displayName`
- `brand.icon`
- rewarded ad `adGroupId` in `src/pages/compare.tsx`

## Data policy in MVP

- All records are stored in local miniapp storage (`plant-growth-v1`)
- Data does not sync between devices
- Reinstall/device change recovery is not supported in this version
