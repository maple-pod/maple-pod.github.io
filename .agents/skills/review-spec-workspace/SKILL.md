---
name: review-spec-workspace
description: Review a Spec-native `.spec/` workspace without mutation. Use `spec validate`, lookup/list/search/trace, relation inspection, and Resource inspection to report deterministic current-workspace findings.
---

# Review Spec Workspace

Keep review read-only. Start with:

```text
spec validate --format json --no-input
```

Report `valid`, `complete`, Artifact/project counts, and every diagnostic. Do
not treat a passing validator as proof that prose is correct, complete for the
product, or aligned with implementation behavior.

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

Review the current `.spec/` workspace only. Do not inspect or interpret an
`.engineering/` tree as Spec state, and do not infer EF transition/range/
bootstrap authority, implementation-linkage status, provider approval, or Git
history from a successful Spec validation.
