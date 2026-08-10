# Query Recipes

Governing use cases: UC-050-UC-055. Governing specs: `13-cli-contract.md` §
Query Commands and § Resource Reading, `10-query-and-trace.md`.

All `ef query <kind>` commands are read-only and return the same
`ef/query-result@1` envelope (`schema`, `kind`, `complete`, `data`,
`diagnostics`). Prefer `--format json --no-input` for every recipe below so
the result is a single parseable object.

Lookup is the only query kind whose "not found" is a normal, complete result.
For `relations`, `trace`, `impact`, `history`, and `resolve-current`, every
explicitly supplied Artifact ID must exist; if any required ID is absent, the
result is `complete: false`, `data: null`, with no partial data - never treat
a partial answer as usable evidence.

## Lookup an exact Artifact

```bash
ef query lookup <artifact-id> --projection summary|full --format json --no-input
```

The default projection is `full`. Lookup is exact and does not resolve
supersession - use `ef query resolve-current` first if the review needs the
current replacement instead of the exact historical ID named by the
requester.

## List by filter

```bash
ef query list \
  --type <value> \
  --status <value> \
  --schema <value> \
  --tag-any <value> \
  --tag-all <value> \
  --relation-type <value> \
  --relation-target <artifact-id> \
  --resource-type <value> \
  --resource-role <value> \
  --resource-normative true|false \
  --offset <n> \
  --limit <n> \
  --format json --no-input
```

Include only the filters relevant to the review (all are optional and
combine with AND across categories). Repeatable options (for example
`--tag-any`) may be given more than once and retain their documented OR/AND
semantics. `--offset` defaults to `0`; omitting `--limit` returns every
match.

## Search literal text

```bash
ef query search <term>... --case-sensitive --offset <n> --limit <n> --format json --no-input
```

At least one term is required. Multiple terms use AND semantics against the
same Artifact. This is normalized literal search, not relevance-ranked or
fuzzy search - useful for finding candidate Artifacts named in a change
description, not for judging relevance.

## Inspect direct relations

```bash
ef query relations <artifact-id> --direction outgoing|incoming|both --type <relation-type> --format json --no-input
```

Direction defaults to `both`. Repeat `--type` to restrict to specific
relation types; omitting it includes every type. Use this to verify the
exact relation edges a CHG or supersession claims (for example that a
`superseded-by` edge, or a CHG's `introduces`/`modifies`/`retires` edges,
actually exist as declared) - never infer an edge that isn't returned.

## Trace a bounded subgraph

```bash
ef query trace <root-id>... --type <relation-type>... --direction outgoing|incoming|both --max-depth <n> --format json --no-input
```

At least one root and one `--type` are required; direction and `--max-depth`
are explicit - the CLI never guesses traversal policy, and this Skill must
not either. Use this to walk an explicit dependency shape (for example every
REQ a PRD's `derived-from` chain reaches) bounded to a caller-chosen depth.

## Estimate impact

```bash
ef query impact <root-id>... --max-depth <n> --include-references --include-non-current --resolve-current --format json --no-input
```

At least one root is required; `--max-depth` is required. `--include-references`,
`--include-non-current`, and `--resolve-current` are optional and each keep
their documented `10-query-and-trace.md` meaning (impact defaults to incoming
active `derived-from`, `addresses`, and `governed-by` candidates). Report
impact results as candidates for review, not as proof that an implementation
change is required or as mutation authorization.

## Resolve current truth

```bash
ef query resolve-current <artifact-id> --format json --no-input
```

The only query kind that resolves supersession. Use it to check a
supersession, split, or consolidation claim: active PRD/REQ/ADR/POL resolve
to themselves, PROJECT resolves to itself, superseded knowledge resolves to
every reachable active leaf (deduplicated, sorted), and draft or retired
knowledge resolve to an empty set. CHG current resolution is unsupported.

## Retrieve engineering and Git history

```bash
ef query history <artifact-id> --format json --no-input
```

Requires complete configured authoritative first-parent integration history.
Returns, oldest-first, the completed CHG effects that targeted the Artifact
and the commits that changed its aggregate (Markdown file, owned Resources,
plus `ef.yaml`/`.gitignore` for PROJECT). Unavailable or shallow history
returns the incomplete result with `EF-QRY-010` and exits `2` - there is no
CHG-only fallback, and this Skill must report that incompleteness rather than
substitute a partial history.

## Read one selected local Resource

```bash
ef resource read <owner-id> <location>
```

Reads exactly the raw bytes of one local Resource declared by `<owner-id>` at
`<location>`, after verifying the owner exists, declares that exact location,
owns it, and that the managed local file exists and is readable. This
command does not accept `--format` and never fetches external URLs; stdout on
success is exactly the Resource file bytes with no added newline or JSON
wrapper. Only read a Resource that the requester or a prior query result
explicitly selected - never traverse or load Resources automatically.

## Staged context composition

When a review needs bounded context rather than one exact ID, follow the
explicit staged composition from `13-cli-contract.md` § Context Composition -
never substitute a hidden or automatic traversal for it:

```text
query list, search, or impact
  -> query resolve-current when requested
  -> query lookup --projection full
  -> resource read for explicitly selected local Resources
```
