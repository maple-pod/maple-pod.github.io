---
name: review-spec-workspace
description: Review a Spec-native `.spec/` workspace without mutation. Use for deterministic validation and for semantic review of Story, Use Case, Feature, and Requirement boundaries, refinement quality, duplication, implementation leakage, relations, and Resources.
---

# Review Spec Workspace

Keep review read-only. Start with:

```text
spec validate --format json --no-input
```

Report `valid`, `complete`, Artifact/project counts, and every diagnostic. Do
not treat a passing validator as proof that prose is correct, complete for the
product, or aligned with implementation behavior.

## Semantic review model

Review the main refinement chain using these responsibilities:

```text
User Story       -> Intent
Use Case         -> Interaction
Feature Spec     -> Semantics
Requirement      -> Normative Contract
Implementation   -> Mechanism (outside persisted Spec authority)
```

Stored `refines` edges point child -> parent:

```text
use-case -> story
feature -> use-case
requirement -> feature
```

The graph is many-to-many; do not infer one-parent or one-child cardinality from
the allowed kind pairs.

- **Story:** actor, goal, and value; should not be a detailed behavior or
  implementation description.
- **Use Case:** scenario and interaction flow, including alternate/failure
  behavior and observable outcomes.
- **Feature:** capability semantics, state/rule invariants, and edge cases that
  make one or more interactions coherent.
- **Requirement:** enforceable and independently verifiable obligation,
  rationale, and verification boundary.

PROJECT/PRD provide higher-level context, Decisions and Policies are
cross-cutting, and Changes are provenance/history rather than current product
truth.

### Semantic findings to look for

Treat the following as review smells, not deterministic validator failures:

- **Mechanical refinement:** every Use Case has exactly one Feature and every
  Feature exactly one Requirement without evidence that each layer adds a
  distinct responsibility.
- **Restatement:** child prose repeats the parent's rules with different
  headings or stronger modal verbs but adds no semantic information.
- **Layer leakage:** Story contains feature rules; Use Case contains internal
  architecture; Feature specifies framework/library mechanisms; Requirement
  captures incidental implementation instead of a stable contract.
- **Monolithic Contract:** one Requirement contains unrelated obligations that
  can evolve, be consumed, or be verified independently.
- **Artificial fragmentation:** tightly coupled clauses of one coherent
  contract are split only to make every MUST its own file.
- **Missed convergence:** multiple Use Cases independently define what should
  be one shared Feature or Contract.
- **Hidden cross-cutting dependency:** a portability, playback, offline,
  security, protocol, or lifecycle rule is duplicated in prose instead of
  referencing an existing shared semantic owner where appropriate.
- **Implementation promoted to truth:** reverse-spec copies existing code
  behavior without distinguishing accepted intent from accidental/legacy
  behavior or defects.

The refinement graph is many-to-many. Do not expect a tree and do not recommend
one Artifact per layer merely for symmetry.

When deciding whether detail belongs in canonical Spec, ask whether it must
remain true if the implementation framework/library/storage mechanism changes.
Implementation-independent behavior usually belongs in Spec; mechanism-specific
detail usually belongs downstream. Compatibility-sensitive protocols, persisted
formats, and externally consumed schemas are exceptions when their exact
behavior is itself part of the contract.

Inspect current specification state with read-only commands:

```text
spec artifact get <uuid> --format json
spec artifact list --kind <kind> --status <status> --format json
spec search <text> --format json
spec trace <uuid> --direction <up|down|both> --format json
spec relation list --artifact <uuid> --direction all --format json
spec resource list --artifact <uuid> --format json
spec resource read <uuid> <local-location> --format json
```

Search is deterministic case-insensitive substring matching over title/body and
has no ranking. Trace traverses only `refines`; use relation listing when other
relation types matter. Relation direction is a focal-Artifact filter; without
`--artifact`, relation listing enumerates the same global stored edge set.
`resource read` is local-only and never fetches HTTPS locations. JSON Resource
reads report `encoding: utf8` for byte-safe UTF-8 and
`encoding: base64` for arbitrary binary bytes. CLI usage/parse failures requested
as JSON use `spec/error-result@1`.

For semantic review, inspect complete chains with `spec trace`, compare parent
and child responsibilities, and search for repeated domain rules across
Artifacts. Report deterministic findings separately from semantic judgments.
Passing structural validation is evidence only for machine-checkable workspace
invariants.

Review the current `.spec/` workspace only. Do not inspect or interpret an
`.engineering/` tree as Spec state, and do not infer EF transition/range/
bootstrap authority, implementation-linkage status, provider approval, or Git
history from a successful Spec validation.
