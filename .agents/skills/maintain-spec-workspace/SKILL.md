---
name: maintain-spec-workspace
description: Maintain a Spec-native `.spec/` workspace with @deviltea/spec-tool. Use for Artifact CRUD, lifecycle transitions, relations, Resources, deterministic search/trace, and validation.
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

Run `spec validate --format json --no-input` after a mutation sequence. A clean
validation proves the deterministic current-workspace invariants only; it does
not prove natural-language semantic adequacy or Git-history correctness. Treat
`spec/error-result@1` as the stable JSON envelope for CLI usage/parse failures.
Concurrent mutating CLI invocations fail fast through an ephemeral workspace
lock rather than overwriting one another; retry after the other mutation ends.

Spec MVP has no `.engineering/` compatibility, EF schema aliases, Git
transition/range/bootstrap authority, implementation-linkage manifest, or
provider dependency. Do not introduce those concepts while operating this
skill.
