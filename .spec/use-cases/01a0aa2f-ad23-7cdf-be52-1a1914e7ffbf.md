---
schema: spec/use-case@1
kind: use-case
id: 01a0aa2f-ad23-7cdf-be52-1a1914e7ffbf
title: Export, import, transfer, and reset saved user data
status: active
relations:
  - type: refines
    target: 01a0aa2f-ab3b-776c-97a5-7fd26d96823e
resources: []
---
## Preconditions
Maple Pod contains personal saved data and may also contain device-local history, offline content, or onboarding state.

## Main Flow
1. The user exports portable saved data as a file or setup link.
2. The user selects an incoming file or link; Maple Pod validates it and shows the import action for confirmation.
3. After confirmation, Maple Pod merges the accepted portable data according to the Saved Data contract.
4. The user may choose Reset Saved Data or Factory Reset, reviews the stated scope, and confirms the destructive action.
5. Maple Pod applies the selected reset scope and returns to normal use.

## Alternate & Failure Flows
- Malformed or invalid incoming data is rejected without changing local state.
- Cancelling import or reset leaves local state unchanged.
- The two reset choices preserve or clear device-local state according to their stated scopes.

## Observable Outcomes
The user can transfer personal configuration without unintentionally transferring device-local content, merge accepted data predictably, and distinguish the narrower reset from the full reset.
