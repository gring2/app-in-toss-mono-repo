# Slot Lifecycle Contract

## Purpose
Define deterministic slot behavior for add/delete flows so users see predictable slot counts.

## In-Scope
- Plant slot state and mutation behavior in `src/plants/store.ts`
- Manage flow in `src/pages/index.tsx`

## Rules

### R1. Minimum slot count
- `unlockedPlantSlots` must never be below `1`.

### R2. Delete slot truncates slot count
- Deleting a plant slot decreases `unlockedPlantSlots` by `1`, bounded by minimum `1` and current plant count.
- Deletion removes plant data + associated photos.

### R3. Add slot is immediate
- Calling slot unlock increments `unlockedPlantSlots` by `1` immediately.
- If capacity exists, user can add a new plant without extra unlock action.

### R4. No hole slot confusion
- After delete, slot keys are normalized for remaining plants.
- UI should not leave “phantom empty slot count” expectation.

## Example Scenarios

1. **2 slots / 2 plants -> delete 1**
   - Before: `unlockedPlantSlots=2`, plants=2
   - After: `unlockedPlantSlots=1`, plants=1
2. **Then unlock once**
   - After unlock: `unlockedPlantSlots=2`, plants=1
   - User can add one plant immediately
3. **1 slot / 1 plant -> delete**
   - After: `unlockedPlantSlots=1`, plants=0

## Test Requirements
Must have automated tests for:
- Truncate on delete
- Min slot floor
- Unlock then add sequence
- Slot key normalization after deletion

## Current Implementation References
- Core slot logic: `src/plants/store.ts`
- Slot behavior tests: `src/plants/store.slot.test.js`
- Manage UI flow: `src/pages/index.tsx`
