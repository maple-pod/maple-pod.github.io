# Spec Tool 0.0.1 → 0.1.0 breaking migration

The current canonical specification is `.spec/` in the frozen-v1 format of `@deviltea/spec-tool@0.1.0`. The old Artifact, `refines`, lifecycle and Resource persistence/CLI are **not** maintained as a compatibility mode. Historical evidence is preserved outside `.spec/` and is not parallel normative authority.

## Preserved source and identity

All **61 original files** (60 Artifacts and `config.yaml`) are retained byte-for-byte in [`legacy/`](./legacy/) and recorded by SHA-256 in [`legacy-sha256.json`](./legacy-sha256.json). The manifest itself has a pinned digest in `scripts/replay-spec-migration.mjs`; editing both source and manifest cannot quietly rewrite the archive. The 16 old `Use Case` semantic identities were retained as the main-flow Scenario identities. Independently authored alternate/failure Scenarios receive distinct deterministic UUIDv7 semantic and storage identities. Every archived alternate bullet, including one non-behavioral scope exclusion, has a traceable entry in the [crosswalk](./alternate-scenario-crosswalk.md) and (for behavioral bullets) a reviewed Given/When/Then case in [`alternate-scenario-plan.mjs`](./alternate-scenario-plan.mjs).

| Old v0.0.1 unit | Frozen-v1 unit | Identity and preservation |
| --- | --- | --- |
| 11 Story | 11 Story | Same semantic UUID; original Actor, Goal and Value; `motivates` derived from each prior Use Case → Feature chain. |
| 16 Use Case | 16 main-flow Scenario + 72 alternate/failure Scenario | The 16 original UUIDs are retained; 50 behavioral alternate/failure bullets are covered by 72 newly authored Scenario identities; including separate cases for compound alternatives; one process-boundary-only bullet is retained explicitly without fabricating a Scenario. |
| 16 Feature | 16 Feature | Same semantic UUID; `Capability` becomes canonical summary; original Feature body is retained as historical notes. |
| 16 Requirement | 16 Feature-local Rule | Same semantic UUID; original `Contract` becomes the normative Rule statement and the complete Requirement body is retained as notes. |
| 1 PROJECT | Outside `.spec/` | Project context remains in the archive and repository docs, not as a v1 semantic unit. |

The resulting v1 graph has **131 nodes** (11 Story, 16 Feature, 16 Rule, 88 Scenario) and **104 edges** (16 Story → Feature `motivates`, 88 Scenario → Rule `demonstrates`). The workspace has 116 canonical files: one manifest, 11 Story files, 16 Feature files with embedded Rules and 88 `.feature` Scenario containers. Each of the 11 Stories motivates at least one Feature. No original Requirement had independently governed cross-Feature normative authority, so the migration did not invent Contracts or Clauses.

## Mechanical conversion and semantic authoring

The original 16 main-flow Scenarios retain their source Preconditions → Given, numbered Main Flow → When and Observable Outcomes → Then. Four original Main Flow statements already started with the English word `When`; their generated steps are rephrased into explicit events using [`main-flow-step-edits.json`](./main-flow-step-edits.json), rather than introducing `When When`. The initial main flows remain broad legacy narratives: a sentence describing a system reaction may still appear within the interaction's `When` phase. Do not mistake these broad migration Scenarios for executable E2E step definitions without further refinement.

All 51 archived alternate/failure-flow bullets were reviewed: 50 behavioral bullets map to 72 distinct observable Given/When/Then Scenarios and one non-behavioral process-boundary bullet is retained as a scope note. Composite conditions such as a failed world-map switch with and without an already-usable map were split into separate cases. The canonical new files link via `demonstrates` to the existing owning Rule and preserve original source bullets through the [crosswalk](./alternate-scenario-crosswalk.md). `demonstrates` is a **semantic connection, not evidence of an implemented, passing or automated test**.

The 16 original Requirements still become one compound Rule per Feature. Future Rule atomization can be considered as a separate authority-changing change, including deliberate reallocation of `demonstrates` edges. Original Feature-local bullets, rationale, verification hints and full Requirement prose remain preserved in noncanonical Feature notes; they are not silently elevated into new independent requirements. There is no v1 equivalent of the previous `active` lifecycle field.

## Independent replay versus evolving current specification

`pnpm spec:validate` and `pnpm spec:scenario-quality` validate the **current** `.spec/`. The second check detects duplicate reserved Gherkin prefixes (for example `When When`) that the frozen-v1 structural validator intentionally accepts as ordinary step text.

`pnpm spec:migration-check` is deliberately different: it recreates the original `.spec/` from the byte-preserved archive **inside a disposable temporary directory**, reruns [`migrate-v0.0.1.mjs`](./migrate-v0.0.1.mjs), checks all 59 original semantic identities, the original main-flow steps, Rules and derived relations, then replays [`author-alternate-scenarios.mjs`](./author-alternate-scenarios.mjs) and confirms all 51 source bullets (including the one scope-only exclusion), all 72 authored cases, the deterministic crosswalk and the frozen migration graph revision. The temporary directory is removed afterwards. **The replay never requires current `.spec/` to equal old specifications**, so a legitimate later Rule, Story or Scenario change does not cause the historical audit to fail. CI runs the current validator, current Scenario quality check and independent historical replay.

`pnpm spec:baseline-compare` additionally compares every byte and filename of the current `.spec/` against the independently replayed initial frozen-v1 snapshot. Run this **only as a one-time premerge migration check**; it is intentionally not a daily CI gate because future changes to canonical Spec must remain possible.

To reproduce the complete initial migration, start with an isolated copy of the archived `.spec/` tree, install dependencies, run the mechanical converter and then the explicit alternate authoring script. Both one-time scripts refuse to overwrite an already-migrated or already-augmented workspace. The canonical v1 design authority is [Discussion #65, Thread 4](https://github.com/DevilTea/deviltea-labs/discussions/65#discussioncomment-18397423).
