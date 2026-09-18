---
name: maintain-spec-workspace
description: Author and maintain a Spec-native `.spec/` workspace with @deviltea/spec-tool. Use when choosing the right specification layer, creating or revising Artifacts, maintaining refinement relationships, performing lifecycle transitions, managing Resources, searching/tracing, and validating the workspace.
---

# Maintain Spec Workspace

Use the `spec` CLI as the invariant-aware interface to the current `.spec/`
workspace. Prefer `--format json` for Agent operation and inspect the returned
`ok`, result payload, and diagnostics before continuing.

Start by validating the workspace:

```text
spec validate --format json --no-input
```

Initialize only when no Spec workspace exists:

```text
spec init --format json --no-input --title "<project title>"
```

## Specification model

Treat the main refinement chain as semantic layers, not as a template that must
always contain one Artifact of every kind:

```text
User Story       -> Intent
Use Case         -> Interaction
Feature Spec     -> Semantics
Requirement      -> Normative Contract
Implementation   -> Mechanism (outside persisted Spec authority)
```

Stored `refines` edges point from the more specific child to its semantic
parent:

```text
use-case     -> story
feature      -> use-case
requirement  -> feature
```

The graph is many-to-many; these are allowed kind pairs, not cardinality rules.

Each layer answers a different question:

- **Story — Intent:** Who needs something, what goal are they pursuing, and why
  is it valuable? Keep implementation and detailed behavior out of this layer.
- **Use Case — Interaction:** What scenario or interaction realizes that intent?
  Describe preconditions, main flow, alternate/failure flows, and observable
  outcomes without turning the scenario into an internal design.
- **Feature — Semantics:** What capability, state semantics, rules, invariants,
  and edge-case behavior make the interaction coherent? A Feature describes
  what the capability means, not how a framework or subsystem implements it.
- **Requirement — Normative Contract:** What independently verifiable
  obligation must hold? Requirements state enforceable behavior and the reason
  and verification boundary for that behavior.
- **Implementation — Mechanism:** Code structure, framework/library choice,
  storage mechanism, internal algorithm, component layout, and similar
  realization details are outside persisted Spec authority unless a detail has
  itself become an externally observable compatibility contract.

PROJECT and PRD are higher-level product context rather than extra mandatory
steps in the refinement chain. Decisions and Policies are cross-cutting
Artifacts. Changes record specification-change provenance rather than current
product truth.

### Refinement discipline

Do not create Artifacts merely to fill every layer. A child Artifact must add a
distinct semantic responsibility instead of restating its parent in a different
template.

- A Story may be refined by multiple Use Cases.
- A shared Feature may refine multiple Use Cases when one semantic capability
  serves multiple interactions.
- A Use Case may be refined by multiple Features when distinct capabilities are
  needed.
- A Feature may be refined by one or multiple Requirements.
- Split Requirements when obligations can evolve, be verified, or be consumed
  independently. Keep tightly coupled obligations together when they form one
  coherent contract.
- Do not infer a missing child solely because a parent exists.

Before creating a child, ask what new information it contributes:

```text
Story        -> new intent/value?
Use Case     -> new interaction/scenario?
Feature      -> new semantic capability/invariant?
Requirement  -> new independently verifiable obligation?
```

If the answer is only "the same content in this layer's headings", do not create
the child yet.

### Authority and implementation evidence

Existing implementation is evidence, not normative truth. For reverse-spec
work:

1. Observe current behavior and implementation evidence.
2. Distinguish accidental behavior, defects, workarounds, and legacy behavior
   from desired semantics.
3. Promote behavior into active specification only after it is accepted as the
   intended contract.
4. When implementation and an accepted active Contract disagree, treat that as
   a discrepancy to investigate; do not silently rewrite the Spec to match code.

Use an implementation-independence test when placement is unclear: if the
framework, library, storage mechanism, or internal architecture changed, would
the statement still need to be true? If yes, it likely belongs in canonical
Spec. If no, it usually belongs in downstream technical design or
implementation.

Compatibility-sensitive transport details, persisted formats, protocol shapes,
or externally consumed schema fields may legitimately be normative. A specific
library or internal mechanism normally is not, unless interoperability depends
on that exact behavior.

## Artifacts

Use Artifact commands for title/body authoring and deterministic lookup:

```text
spec artifact create --kind <kind> --title "<title>" --format json
spec artifact get <uuid> --format json
spec artifact update <uuid> --body-file <path> --format json
spec artifact list --kind <kind> --status <status> --format json
spec artifact delete <uuid> --format json
```

New non-PROJECT Artifacts begin as `draft`. Only draft Artifacts may be
physically deleted. Do not directly edit `id`, `kind`, `schema`, lifecycle,
relations, or Resource descriptors when the CLI has a dedicated operation.

Before activation or CHG completion, populate the kind's required body sections.
Required sections are structural prompts, not permission to duplicate parent
content:

```text
PRD          Problem / User Need / Desired Outcome / Success Criteria / Non-goals
Story        Actor / Goal / Value
Use Case     Preconditions / Main Flow / Alternate & Failure Flows / Observable Outcomes
Feature      Capability / Semantics / Rules / Edge Cases
Requirement  Contract / Rationale / Verification
```

Use lifecycle commands for state changes:

```text
spec lifecycle activate <uuid> --format json
spec lifecycle complete <change-uuid> --format json
spec lifecycle retire <uuid> --format json
spec lifecycle supersede <replacement-uuid> <replaced-uuid> --format json
```

`superseded`, `retired`, and `completed` are terminal. Chained supersession
transfers the replaced Artifact's current replacement targets to the new active
replacement.

## Relations and Resources

Use dedicated relation operations so graph invariants are checked:

```text
spec relation add <source-uuid> <target-uuid> --type <type> --format json
spec relation remove <source-uuid> <target-uuid> --type <type> --format json
spec relation list --artifact <uuid> --direction all --format json
```

Local Resources must live under `.spec/resources/<owner-uuid>/...`. HTTPS
Resources are descriptor-only; `spec resource read` never fetches them. In JSON
mode, byte-safe UTF-8 Resource content uses `encoding: utf8`; arbitrary binary
content uses `encoding: base64` so bytes are not corrupted.

```text
spec resource add <owner-uuid> --location <location> --role <role> --media-type <media-type> --format json
spec resource remove <owner-uuid> <location> --format json
spec resource list --artifact <owner-uuid> --format json
spec resource read <owner-uuid> <location> --format json
```

## Discovery

Use deterministic local discovery instead of guessing IDs or relationships:

```text
spec search <text> --kind <kind> --status <status> --format json
spec trace <uuid> --direction <up|down|both> --format json
```

Search is case-insensitive literal substring matching over Artifact title/body
with no ranking. Trace follows only the `refines` graph.

Use `spec trace` before adding a new refinement so existing shared Features or
Requirements are reused instead of creating parallel copies. Use relation
listing for cross-cutting dependencies that are not `refines`.

Run `spec validate --format json --no-input` after a mutation sequence. A clean
validation proves the deterministic current-workspace invariants only; it does
not prove natural-language semantic adequacy, correct layer placement,
non-duplicative decomposition, or Git-history correctness. Treat
`spec/error-result@1` as the stable JSON envelope for CLI usage/parse failures.
Concurrent mutating CLI invocations fail fast through an ephemeral workspace
lock rather than overwriting one another; retry after the other mutation ends.

Spec MVP has no `.engineering/` compatibility, EF schema aliases, Git
transition/range/bootstrap authority, implementation-linkage manifest, or
provider dependency. Do not introduce those concepts while operating this
skill.
