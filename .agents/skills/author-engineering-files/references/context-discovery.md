# Context Discovery

Governing spec: `13-cli-contract.md` § Context Composition and § Query
Commands; `10-query-and-trace.md` § Context Composition.

EF Core v1 has no bundle-context command (there is no `context` subcommand
under `ef`). Context is composed explicitly,
in stages, so no hidden traversal, automatic identity resolution, or
implicit Resource loading ever happens:

```text
query list, search, or impact
  -> query resolve-current when requested
  -> query lookup --projection full
  -> resource read for explicitly selected local Resources
```

Never skip a stage to save a round trip, and never load an Artifact's full
body or a Resource's bytes "just in case." Read only what the current task
needs.

## Stage 0 - orient on the project

Nearly every task starts here:

```bash
ef query lookup PROJECT --projection full --format json --no-input
```

`found: false` here means no EF project exists yet -> return to the
top-level workflow decision in `SKILL.md`: greenfield setup goes to
`references/project-init.md`, an established codebase adopting EF for the
first time goes to `references/existing-project-bootstrap.md`. Otherwise
this gives Vision, Scope,
Non-goals, Context, and the canonical Terminology glossary - the vocabulary
and boundaries every later step and every draft you write must respect.

## Stage 1 - find candidate Artifacts

Pick exactly one of these, whichever matches how the human described the
task. Do not read the whole `.engineering/` tree by hand instead.

```bash
# Structured filters (repeat a filter flag for OR/AND per its documented semantics)
ef query list --type req --status active --format json --no-input
ef query list --tag-any search --tag-any filtering --format json --no-input
ef query list --relation-type derived-from --relation-target PRD-012 --format json --no-input

# Literal text search (at least one term; multiple terms AND at Artifact scope)
ef query search filtering --format json --no-input
ef query search filtering search --case-sensitive --format json --no-input

# Potential-impact traversal from a root that is about to change
ef query impact REQ-031 --max-depth 3 --format json --no-input
ef query impact REQ-031 --max-depth 3 --resolve-current --format json --no-input
```

`--offset`/`--limit` paginate `list`/`search`; omit `--limit` to mean "all
matches" (JSON `null`), which is fine for a first exploratory pass.

Every result here is a **summary** projection only (no body, no Resource
bytes). Use it to select exact Artifact IDs, not to answer the task directly.

## Stage 2 - resolve current identity when the target may be superseded

Only when the task concerns "the current version of X" and X might have been
superseded:

```bash
ef query resolve-current REQ-031 --format json --no-input
```

`resolve-current` is the only query that resolves supersession implicitly.
Every other query command (including `lookup`) is exact identity and does
not silently follow `superseded-by`.

## Stage 3 - load full context for exactly the selected IDs

```bash
ef query lookup REQ-070 --projection full --format json --no-input
```

`--projection` defaults to `full` (summary + Markdown `body`). Call this once
per exact ID you actually need - not for every candidate from Stage 1.

`found: false` is a normal, complete result (exit `0`), not an error: it
means that exact ID does not exist. Do not retry with variant spellings or
guess a nearby ID.

## Stage 4 - read a Resource only when explicitly selected

Resource bytes are never bundled into any query result. After Stage 3 shows
you the owner's `resources[]` descriptors, read exactly the one you need:

```bash
ef resource read REQ-070 .engineering/resources/REQ-070/search-filter.schema.json
```

This command has no `--format` flag and prints raw bytes on success with no
added framing or newline; on failure stdout is empty and a diagnostic goes to
stderr (not a stable machine envelope - do not parse it as JSON). Do not
fetch `http(s)://` Resource locations; Core never fetches external URLs, and
neither should this Skill.

## Other read-only query shapes, used when the task needs them

```bash
ef query relations REQ-031 --direction incoming --format json --no-input
ef query relations REQ-031 --direction both --type derived-from --format json --no-input
ef query trace PRD-012 --type derived-from --direction incoming --max-depth 4 --format json --no-input
ef query history REQ-031 --format json --no-input
```

`relations`, `trace`, `impact`, `history`, and `resolve-current` all require
every explicitly supplied Artifact ID to exist; a missing ID makes the whole
result incomplete (`complete: false`, exit `2`), not a partial answer. Treat
that as "the ID doesn't exist," not as a tool failure to route around.

## Non-negotiables

- Never construct an Artifact's context by reading files under `.engineering/`
  directly when a query command can answer the same question - queries are
  the deterministic, tested source of truth for matches, ordering, and
  completeness; ad hoc file reads are not.
- Every `--format json` call in this Skill also passes `--no-input` for
  determinism, though JSON mode implies `--no-input` regardless.
- Never treat a query result as authorization to mutate. Queries are strictly
  read-only.
