---
name: "pm-workflow-test-scenarios"
description: "Generate comprehensive test scenarios from user stories or feature specs in Codex. Codex wrapper for Claude's /test-scenarios command."
---

# PM Workflow: Test Scenarios

This skill is the Codex conversion of Claude's `/test-scenarios` command from the PM Skills Marketplace.
It preserves the original workflow and underlying PM frameworks, but packages them as a Codex skill instead of a slash command.

## Codex Usage
- Recommended invocation: `$pm-workflow-test-scenarios <user stories, feature spec, or description>`
- Original Claude argument hint: `<user stories, feature spec, or description>`
- Source plugin: `pm-execution`
- Original Claude command: `/test-scenarios`

## Execution Guidance
- Ask only for the minimum missing context needed to continue.
- If the user already provided enough context, skip the interview-style questions and produce the workflow output directly.
- Reuse the imported PM skills referenced below whenever they fit the task.
- Save substantial deliverables as markdown files when helpful.

## Upstream Workflow
## Test Scenario Generator

Turn user stories or feature descriptions into comprehensive test scenarios that QA can execute immediately. Covers happy paths, edge cases, error handling, and cross-browser/device considerations.

## Invocation

```
/test-scenarios [paste user stories or acceptance criteria]
/test-scenarios [upload a PRD or feature spec]
/test-scenarios User can reset their password via email link
```

## Workflow

### Step 1: Accept Input

Accept: user stories, acceptance criteria, PRD sections, feature descriptions, or any specification of expected behavior.

### Step 2: Generate Test Scenarios

Apply the **test-scenarios** skill:

For each user story or requirement, generate:

**Happy Path Scenarios**: The expected user flow works correctly
**Edge Cases**: Boundary conditions, unusual inputs, concurrent operations
**Error Scenarios**: What happens when things go wrong
**Security Scenarios**: If applicable (auth, permissions, data access)
**Performance Scenarios**: If applicable (load, timeout, large data)

### Step 3: Structure Output

```
## Test Scenarios: [Feature]

**Source**: [user stories / PRD / description]
**Total scenarios**: [count]
**Coverage**: [happy path / edge cases / errors / security / performance]

### Scenario 1: [Title]
**Tests**: [which story or requirement]
**Preconditions**: [setup needed]
**User role**: [who is performing this]

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | [user action] | [expected system response] |
| 2 | [user action] | [expected system response] |

**Postconditions**: [state after completion]
**Priority**: [Critical / High / Medium / Low]

---
[Repeat for each scenario]

### Coverage Matrix
| Requirement | Happy Path | Edge Cases | Error Handling | Notes |
|------------|-----------|-----------|---------------|-------|

### Test Data Requirements
[What test data is needed to execute these scenarios]
```

Save as markdown.

### Step 4: Offer Next Steps

- "Want me to **generate the test data** for these scenarios?"
- "Should I **add more edge cases** for any specific scenario?"
- "Want me to **create the user stories** that these scenarios test?"

## Notes

- Happy paths first, then layer in edge cases — ensure basic flows work before testing boundaries
- Every acceptance criterion from the original story should map to at least one test scenario
- Include both positive tests (it works) and negative tests (it fails gracefully)
- For APIs, include scenarios for rate limiting, timeout, malformed requests, and auth failures
- Flag scenarios that require specific test environments or third-party service mocking
