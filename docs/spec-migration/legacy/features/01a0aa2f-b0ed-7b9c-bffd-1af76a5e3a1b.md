---
schema: spec/feature@1
kind: feature
id: 01a0aa2f-b0ed-7b9c-bffd-1af76a5e3a1b
title: Saved user-data portability and reset
status: active
relations:
  - type: refines
    target: 01a0aa2f-ad23-7cdf-be52-1a1914e7ffbf
resources: []
---
## Capability
Provide portable personal-data transfer and two deliberate scopes for clearing Maple Pod-owned state.

## Semantics
Portable data is a selected subset of personal configuration, separate from device-local activity, cached content, and onboarding state. Import is a validated merge: supplied known values take precedence, omitted values remain local, and unknown values do not become opaque stored state. Reset Saved Data and Factory Reset have intentionally different ownership boundaries.

## Rules
- The portable boundary follows the Saved Data contract and excludes device-local history, offline content, and onboarding state.
- Reset Saved Data clears portable state and recent activity while preserving device-local offline and onboarding state.
- Factory Reset clears all Maple Pod-owned local state.
- Import and both destructive resets require explicit user confirmation where the contract specifies it.
- Transfer wire compatibility is defined by the separate Saved Data protocol requirement.

## Edge Cases
Partial valid imports update only supplied data. Invalid known data causes no mutation. A same-identity incoming entity follows incoming-wins merge semantics. A full reset may span several storage domains without changing the product-level scope.
