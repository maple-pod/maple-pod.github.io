# Spec Tool 0.0.1 → 0.1.0 migration

The canonical specification is now `.spec/` in the frozen-v1 format used by `@deviltea/spec-tool@0.1.0`. The previous Artifact, `refines`, lifecycle, and Resource model is intentionally **not** available as a compatibility mode. This is a one-time, breaking migration of the already-accepted Maple Pod specifications, not a fresh product specification review.

## Source and traceability

The **61 original files** (60 Artifacts and `config.yaml`) are retained byte-for-byte in [`legacy/`](./legacy/) and recorded by SHA-256 in [`legacy-sha256.json`](./legacy-sha256.json). These files are *historical evidence*, not competing current authority; do not feed them to the v1 CLI or edit both trees. `migrate-v0.0.1.mjs` documents the one-time conversion logic and refuses to overwrite an already-migrated v1 workspace. `pnpm spec:migration-check` verifies archive hashes, original identity preservation, normalized node types, exact source-derived relation mapping, Scenario endpoints, and original prose retention.

| 0.0.1 | 0.1.0 | Identity |
| --- | --- | --- |
| 11 Story | 11 Story | Same semantic UUID; frontmatter Actor / Goal / Value; `motivates` is derived through the prior Use Case → Feature chain. |
| 16 Use Case | 16 Scenario | Same semantic UUID; independent Scenario-container storage UUID; Preconditions → Given, numbered Main Flow → When, Observable Outcomes → Then. |
| 16 Feature | 16 Feature | Same semantic UUID; `Capability` → canonical summary, the full original explanatory body retained as noncanonical notes. |
| 16 Requirement | 16 embedded Rule | Same semantic UUID; one owning Feature each; the original `Contract` becomes the Rule statement, the full original REQ body remains in Feature notes. |
| 1 PROJECT | Outside `.spec/` | Project context remains in the archive and the repository docs; PROJECT is not a v1 semantic unit. |

The source graph had exactly one Feature per Use Case and one Requirement per Feature, so there are **16 Story → Feature `motivates` edges**, **16 Scenario → Rule `demonstrates` edges**, and **59 preserved semantic UUIDs**. All 11 Stories motivate at least one Feature. None of these Requirements had independently governed, cross-Feature normative authority, so this conversion does not invent Contracts or Clauses. The v1 graph is derived from 44 canonical files: one manifest, 11 Story files, 16 Feature files with 16 embedded Rules, and 16 `.feature` containers.

## Semantic limitations and follow-up review

- Every original REQ becomes **one compound Rule**. Atomizing such Rules or separating independently governed cross-Feature obligations is a subsequent semantic design review; avoid mechanically creating duplicate normative statements merely to inflate the Rule count. Prior Feature-local rule bullets and edge cases remain in the Feature's noncanonical explanatory notes; review them against the canonical Rule when making future revisions.
- Each prior Use Case becomes one Scenario with the source Preconditions, Main Flow and Observable Outcomes. The **Alternate & Failure Flows are fully preserved in the historical archive** but are not automatically promoted to additional canonical Scenarios: that requires deliberate scenario authoring and review. A main-flow step that describes an observable system response can presently appear as `When` because the old narrative was not authored as strict Gherkin; review step classification if downstream tooling relies on precise Given/When/Then roles.
- `demonstrates` is a *semantic link*, not evidence that automated tests ran, passed, or cover those behaviors. A passing structural validator cannot prove semantic equivalence, adequacy of the newly modeled interactions, or implementation conformance. There is no v1 lifecycle-status equivalent for the old `active` field; no authority-transition claim is made by migration.

Run `pnpm install --frozen-lockfile`, `pnpm spec:validate`, `pnpm exec spec graph export --root .`, and `pnpm spec:migration-check` after checkout. Do not run the migration script again on an existing v1 workspace. The canonical v1 design is [Discussion #65, Thread 4](https://github.com/DevilTea/deviltea-labs/discussions/65#discussioncomment-18397423).
