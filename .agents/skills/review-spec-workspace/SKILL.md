---
name: review-spec-workspace
description: Read-only structural and semantic review of a frozen-v1 @deviltea/spec-tool workspace. Use for validating Story/Feature/Rule/Scenario/Contract/Clause responsibilities, source-owned relation legality, duplicate authority, inherited applicability, graph consistency and agent-ready downstream specification quality without executing tests.
---

# Review Spec Workspace (frozen v1)

Keep review **read-only**. The canonical model is [Discussion #65, Thread 4](https://github.com/DevilTea/deviltea-labs/discussions/65). The retired Artifact/Resource/status/refines model is not a supported public API. Report actual observations separately from design advice and any speculative test-generation opportunity.

## First validate and inspect the graph

```sh
spec workspace validate --root .
spec graph export --root .
```

If the validator reports `valid:false` (via JSON **stderr**, nonzero exit), record all `issues[]` with `source.path`, diagnostic `path`, `reason` and `message`. The workspace then has no valid semantic revision; do not request best-effort graph reads or attempt semantic mutations. Structural repair is external to v1. A valid but **empty** workspace is acceptable when its manifest is correct.

For a valid snapshot, use these read-only commands with JSON input on stdin:

```sh
spec graph list --root . <<<'{"kind":"story"}'
spec graph get --root . <<<'{"id":"<semantic-uuid>"}'
spec graph incoming --root . <<<'{"id":"<semantic-uuid>"}'
spec graph outgoing --root . <<<'{"id":"<semantic-uuid>"}'
```

All normal reads return `{revision,data}`. Check the revision remains consistent across sequential queries; if it changes, restart the review against the new snapshot. Inspect the full `graph export` before inferring relations from prose. Normalize facts by UUID and effective edges, not by filenames or headings.

## Structural review

Review the six semantic kinds and their placement:

- **Story:** actor, goal and value express intent; requires ≥1 `motivates` Feature.
- **Feature:** behavior and invariants; owns 0..N embedded Rules with stable global UUIDs.
- **Rule:** one clear Feature-local behavioral obligation; its `ownerId` must resolve to a Feature.
- **Scenario:** one first-class observable interaction with ordered effective `given/when/then` steps and ≥1 `demonstrates` Rule/Clause/Feature/Contract. This is **not** a test, coverage or passing-status assertion.
- **Contract:** normative authority that truly crosses Feature boundaries and requires independent lifecycle/ownership; must constrain ≥1 Feature. A shared local rule alone does not justify a standalone Contract.
- **Clause:** normative obligation belonging to a Contract, optionally restricting Feature/Rule targets. Absent persisted `constrains` inherits the Contract scope; a present nonempty array completely overrides it. `ownerId` must resolve to its Contract.

Check that `motivates`, `demonstrates` and `constrains` edges have only legal source/target kinds, no duplicates, required minimum cardinalities and no unresolved UUIDs. Normalized IR **materializes Clause effective constrains edges** even for inheritance; `graph incoming/outgoing` can expose the true impact of a Contract scope change. Flag unexpected semantic overlaps, but do not invent errors from presentation-only Rule/Clause order.

Ensure workspace-global lowercase UUIDv7 uniqueness across all six kinds, even children embedded in owner files. Confirm Story/Feature/Contract frontmatter shapes are exact and ordered, filenames match top-level IDs, and Scenario storage IDs are not confused with semantic IDs. Only `.spec/spec.yaml` and the four flat storage directories belong to canonical state; an empty initialized workspace is valid.

## Qualitative semantic review

Validator success is **structural**, not proof that prose or the product is correct. Independently assess:

- **Intent vs semantics:** Story answers who/goal/value; Feature and Rules define actual capability meaning and observable invariants, without implementation framework details.
- **Interaction vs obligation:** Scenario has meaningful Given/When/Then behavior and demonstrates the most precise suitable Rule/Clause. It should not be written as a claim a test ran. A Rule/Clause should not simply repeat a Scenario's literal step wording.
- **Normative ownership:** A cross-Feature Contract needs independent authority; Clauses should be cohesive, testable semantic obligations rather than arbitrary line splitting or duplication of local Rules. Clause override must be a deliberate **complete replacement**, not accidental union with the parent.
- **Reference effects:** Inspect incoming `demonstrates`/`constrains` before Rule↔Clause conversion, owner movement, and deletion. Converting a Rule to Clause can make inbound Clause→Rule constrains illegal; the operation must reject rather than silently drop it. Feature/Contract compound deletion must name all current children and refuse inbound references on the owner and on every child.
- **Machine usability:** Are IDs, precise language, normalized Scenario steps and effective edges sufficient for downstream analysis, E2E planning or mutation-test design? Report missing observable outcomes or ambiguous obligations as review suggestions; do not claim downstream tests were generated or executed.

## Report

Separate deterministic validator issues, confirmed semantic contradictions, possible qualitative improvements and unverified assumptions. Link findings to **semantic UUIDs and repository-relative source paths**, and list affected relations. Use no mutated spec files, no repair commands, no implicit scope changes, no test runners and no implementation management from this review skill.

The canonical semantic revision excludes comments, bodies, source moves and presentation-only child ordering. If a review spans an external edit or partial file write, rerun validation and graph export after the workspace becomes stable. Direct external edits do not participate in Spec Tool locks; never treat the presence of a temporary lock as a safe invitation to delete it without verifying the holding process.
