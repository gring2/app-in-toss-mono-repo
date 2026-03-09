# Worker Assignment: worker-3

**Team:** replace-design-component-to-td
**Role:** executor
**Worker Name:** worker-3

## Your Assigned Tasks

- **Task 3**: good design enough to pass submission review
  Description: good design enough to pass submission review
  Status: pending

## Instructions

1. Load and follow the worker skill from the first existing path:
   - `${CODEX_HOME:-~/.codex}/skills/worker/SKILL.md`
   - `~/.agents/skills/worker/SKILL.md`
   - `/Users/jinwoopark/app-in-toss-test/toss-plant-growth-miniapp/.agents/skills/worker/SKILL.md`
   - `/Users/jinwoopark/app-in-toss-test/toss-plant-growth-miniapp/skills/worker/SKILL.md` (repo fallback)
2. Send startup ACK to the lead mailbox BEFORE any task work (run this exact command):

   `omx team api send-message --input "{"team_name":"replace-design-component-to-td","from_worker":"worker-3","to_worker":"leader-fixed","body":"ACK: worker-3 initialized"}" --json`

3. Start with the first non-blocked task
4. Resolve canonical team state root in this order: `OMX_TEAM_STATE_ROOT` env -> worker identity `team_state_root` -> config/manifest `team_state_root` -> local cwd fallback.
5. Read the task file for your selected task id at `/Users/jinwoopark/app-in-toss-test/toss-plant-growth-miniapp/.omx/state/team/replace-design-component-to-td/tasks/task-<id>.json` (example: `task-1.json`)
6. Task id format:
   - State/MCP APIs use `task_id: "<id>"` (example: `"1"`), not `"task-1"`.
7. Request a claim via CLI interop (`omx team api claim-task --json`) to claim it
8. Complete the work described in the task
9. Complete/fail it via lifecycle transition API (`omx team api transition-task-status --json`) from `"in_progress"` to `"completed"` or `"failed"` (include `result`/`error`)
10. Use `omx team api release-task-claim --json` only for rollback to `pending`
11. Write `{"state": "idle", "updated_at": "<current ISO timestamp>"}` to `/Users/jinwoopark/app-in-toss-test/toss-plant-growth-miniapp/.omx/state/team/replace-design-component-to-td/workers/worker-3/status.json`
12. Wait for the next instruction from the lead
13. For legacy team_* MCP tools (hard-deprecated), use `omx team api`; do not pass `workingDirectory` unless the lead explicitly asks (if resolution fails, use leader cwd: `/Users/jinwoopark/app-in-toss-test/toss-plant-growth-miniapp`)

## Mailbox Delivery Protocol (Required)
When you are notified about mailbox messages, always follow this exact flow:

1. List mailbox:
   `omx team api mailbox-list --input "{"team_name":"replace-design-component-to-td","worker":"worker-3"}" --json`
2. For each undelivered message, mark delivery:
   `omx team api mailbox-mark-delivered --input "{"team_name":"replace-design-component-to-td","worker":"worker-3","message_id":"<MESSAGE_ID>"}" --json`

Use terse ACK bodies (single line) for consistent parsing across Codex and Claude workers.

## Message Protocol
When using `omx team api send-message`, ALWAYS include from_worker with YOUR worker name:
- from_worker: "worker-3"
- to_worker: "leader-fixed" (for leader) or "worker-N" (for peers)

Example: omx team api send-message --input "{"team_name":"replace-design-component-to-td","from_worker":"worker-3","to_worker":"leader-fixed","body":"ACK: initialized"}" --json


## Verification Requirements

## Verification Protocol

Verify the following task is complete: each assigned task

### Required Evidence:

1. Run full type check (tsc --noEmit or equivalent)
2. Run test suite (focus on changed areas)
3. Run linter on modified files
4. Verify the feature/fix works end-to-end
5. Check for regressions in related functionality

Report: PASS/FAIL with command output for each check.

## Fix-Verify Loop

If verification fails:
1. Identify the root cause of each failure
2. Fix the issue (prefer minimal changes)
3. Re-run verification
4. Repeat up to 3 times
5. If still failing after 3 attempts, escalate with:
   - What was attempted
   - What failed and why
   - Recommended next steps

When marking completion, include structured verification evidence in your task result:
- `Verification:`
- One or more PASS/FAIL checks with command/output references


## Scope Rules
- Only edit files described in your task descriptions
- Do NOT edit files that belong to other workers
- If you need to modify a shared/common file, write `{"state": "blocked", "reason": "need to edit shared file X"}` to your status file and wait
- Do NOT spawn sub-agents (no `spawn_agent`). Complete work in this worker session.
