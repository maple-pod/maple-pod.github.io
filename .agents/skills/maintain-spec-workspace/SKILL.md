---
name: maintain-spec-workspace
description: Maintain a frozen-v1 @deviltea/spec-tool workspace through semantic UUID-oriented CLI and TypeScript operations. Use for Story/Feature/Rule/Scenario/Contract/Clause authoring, validated source-owned relations, revision-safe changes and explicit cross-kind lifecycle/compound deletion.
---

# Maintain Spec Workspace (frozen v1)

Spec Tool is **semantic specification authority**, not a PM, implementation, testing or migration system. [Discussion #65, Thread 4](https://github.com/DevilTea/deviltea-labs/discussions/65) is the canonical design source. Never infer v0 Artifact/status/Resource/refines behavior from historical files; those operations do not exist in the replacement.

## Start with a validated snapshot

Resolve the current repository root explicitly when possible. The default is Git toplevel; outside Git, `--root` is required.

```sh
spec workspace validate --root .
spec graph export --root .
```

Before initialization, inspect whether `.spec` exists. Only when **absent**, use:

```sh
spec workspace init --root .
```

This creates **only** `.spec/spec.yaml` (exactly `formatVersion: 1` plus newline). An empty semantic workspace is valid. Never use init to repair/overwrite existing files.

All structured requests go on **stdin as JSON**. Output defaults to one JSON result on stdout for success, one JSON error on stderr for failure; `--format human` is opt-in. A failed `workspace validate` emits `{valid:false,issues:[]}` to stderr with nonzero exit. If validation fails, inspect `issues[]` and ask the owner to repair invalid persistence externally; no semantic read, write or repair API is valid while the workspace is invalid.

Keep the current `revision` from `graph export`. Every mutation must include `expectedRevision`, and after every semantic change refresh it from the success response. On `revision_conflict`, reread relevant nodes and effective relations, reconcile intent, then retry only with a confirmed current revision.

## Place the semantic obligation correctly

| Unit | Responsibility | Creation rule |
| --- | --- | --- |
| Story | Intent: actor, goal, value | Story `motivates` ≥1 existing Feature |
| Feature | Capability semantics and invariants | Can contain 0..N stable-addressed Rules |
| Rule | Local behavioral obligation | Embedded in exactly one Feature |
| Scenario | Observable interaction | Gherkin Scenario `demonstrates` ≥1 Rule/Clause/Feature/Contract |
| Contract | Independently governed normative authority crossing Feature boundaries | `constrains` ≥1 Feature |
| Clause | Contract-owned obligation | 0..N per Contract; optional effective-scope override |

Use a standalone Contract **only if** the authority both crosses Feature boundaries and requires independent ownership/lifecycle; importance, testability or sharing alone does not suffice. Use a Feature-local Rule otherwise. Use Cases are analysis concepts, not persisted artifacts. Implementations, running tests and claims of coverage belong downstream.

### Canonical relations

- `motivates`: Story → Feature (1..N).
- `demonstrates`: Scenario → Rule | Clause | Feature | Contract (1..N), a **specification** relation, not execution/coverage evidence. Prefer the precise Rule/Clause when it exists.
- `constrains`: Contract → Feature (1..N). Clause → Feature | Rule with an optional own complete override; omitted override means inherit Contract scope.

Never invent relations by prose implication. Query the normalized graph for real existing target UUIDs and check kind legality before modifying them. Target UUID arrays are sets: no duplicates, sorted canonically in persistence.

```sh
spec graph list --root . <<<'{"kind":"feature"}'
spec graph outgoing --root . <<<'{"id":"<semantic-uuid>"}'
spec graph incoming --root . <<<'{"id":"<target-uuid>"}'
```

`graph set-relation-targets` uses `{sourceId,type,targets,expectedRevision}`. Supply complete final target sets, not incremental patches. For Clause `constrains`, `targets:null` **removes its override and restores inheritance**; an explicit nonempty array fully replaces the inherited scope, not a union. An empty array is invalid where 1..N is required.

## Semantic mutations

```sh
printf '%s\n' '{"title":"Search","summary":"Return matching items","expectedRevision":"<current-sha256>"}' \
  | spec feature create --root .

printf '%s\n' '{"ownerId":"<feature-uuid>","statement":"Results have deterministic ordering","expectedRevision":"<new-sha256>"}' \
  | spec rule create --root .
```

Public resource namespaces and operations:

```text
workspace init|validate
graph export|get|list|incoming|outgoing|set-relation-targets
story create|update|delete
feature create|update|delete|delete-with-children
rule create|update|delete|reorder|reparent|promote
scenario create|update|delete
contract create|update|delete|delete-with-children
clause create|update|delete|reorder|reparent|demote
```

Creates allocate the UUID; never provide an ID to create. Updates change only named semantic fields. Scenario `steps` are supplied as the complete normalized array of `{type:"given"|"when"|"then",text}` and need effective phase order `Given* → When+ → Then+`. Persistence uses restricted Gherkin, with `And/But` normalized to their previous phase. No step-level insert API, arbitrary tags or Scenario storage repack API.

Rule/Clause reorder takes `{ownerId,orderedIds,expectedRevision}` containing exactly **all** current child UUIDs. Reparent takes `{id,newOwnerId,expectedRevision}`, keeps identity and appends to the new owner. Neither array order nor Markdown notes are semantic revision inputs.

Rule → Clause promotion is `{id,newOwnerId,relations:{constrains:null|UUID[]},expectedRevision}`, where null is inheritance; Clause → Rule demotion is `{id,newOwnerId,relations:{},expectedRevision}`. Conversion preserves UUID and explicitly resolves final relationship state. Audit inbound `constrains` and `demonstrates` first; incompatible inbound references **block** conversion and cannot be silently cleaned.

Ordinary Feature/Contract deletion refuses any attached children; normal deletion of any unit with inbound references is blocked. Compound `delete-with-children` requires `{ownerId,childIds,expectedRevision}` and an exact current child-ID set, with each child and owner having no inbound edges. Never imply a broader cascade. If in doubt, query `graph incoming` for every deleted ID.

## Finish and verify

After changes, run `workspace validate`, inspect the full normalized `graph export` and compare semantic nodes and effective edge deltas against the original intent. Success mutation responses include `revision,changedNodes,deletedIds,changedEdges.added,changedEdges.removed`. Check the complete result, especially inherited Clause edges after Contract scope changes and cross-kind conversion.

Canonical persisted state is only `.spec/spec.yaml` and the four optional flat roots (`stories`, `features`, `contracts`, `scenarios`). Preserve free-form Markdown bodies and Scenario comments on unrelated semantic edits. Only Spec Tool processes use its transient read/write filesystem locks; direct external writes bypass them. A crashed process may leave stale tokens, so verify liveness before manually clearing `.spec-tool-v1.lock` or `.spec-tool-v1.readers`. Neither test execution nor invalid-state repair is part of this skill.
