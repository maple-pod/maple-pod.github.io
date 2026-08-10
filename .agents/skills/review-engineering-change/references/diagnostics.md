# Explaining Diagnostics

Governing use case: UC-045. Governing specs: `09-validation.md` §
Diagnostic Contract, `10-query-and-trace.md`, and the companion
`diagnostic-registry.md` (the authoritative index of every stable code - do
not memorize or re-derive codes; look them up there when a code is unfamiliar).

This Skill explains what a returned diagnostic means; it never invents a code
that the CLI did not return, and it never suppresses or reclassifies a
severity that the validator assigned.

## Diagnostic object shape

Every diagnostic in an `ef/validation-result@1` or `ef/query-result@1`
envelope has this shape (`09-validation.md` § Diagnostic Contract):

```json
{
	"code": "EF-REL-003",
	"severity": "error",
	"message": "Relation target 'REQ-999' does not exist.",
	"path": ".engineering/req/REQ-031.md",
	"artifact_id": "REQ-031",
	"location": { "line": 12, "column": 13 },
	"field": "relations[0].target",
	"related": []
}
```

`code`, `severity`, `message`, and `related` are always present. `path`,
`artifact_id`, `location`, `field`, and `section` are present when
applicable. `location` line/column are one-based; column counts Unicode
scalar values. `related` entries point at other participating locations (for
example both sides of a duplicate ID or a cross-file cycle) - read them, they
are frequently the more actionable location.

When explaining a diagnostic to the requester, quote `code`, `severity`, and
every present location field (`path`/`artifact_id`/`location`/`field`/
`section`) rather than paraphrasing only the `message` text - message
wording may change between compatible releases, but the code and location
fields are the stable contract.

## Severity

- `error` - an integrity-contract violation, or an execution condition that
  prevented the requested contract from completing. Always prevents a valid
  result.
- `warning` - an interpretable but non-canonical state, or a defined risk.
  Under `--strict` or `--warnings-as-errors`, warnings fail the result the
  same as errors.
- `info` - allowed state or execution context (for example incomplete-but-
  valid draft content, or an unavailable optional specialized validator).
  Never makes a result fail.

## Cascading diagnostics

A primary finding that makes a dependent check unreliable suppresses
speculative secondary findings for the same file or entity (for example a
frontmatter parse failure suppresses missing-required-field findings for
that file). If a diagnostic seems to be "missing" a consequence you would
expect, check whether a more primary diagnostic for the same file or ID
already covers it before assuming the validator missed something.

## Namespace ownership (for orienting an unfamiliar code)

| Namespace | Primary responsibility |
|---|---|
| `EF-ENV-*` | Serialized envelope and frontmatter representation |
| `EF-FS-*` | Filesystem layout, configuration, workspace association |
| `EF-ID-*` | Identity, canonical Artifact path, uniqueness, singleton rules |
| `EF-LIFE-*` | Status applicability and transition, freeze, deletion |
| `EF-REL-*` | Relation entry shape, compatibility, targets, non-supersession graph rules |
| `EF-SUP-*` | Supersession topology, atomicity, current resolution |
| `EF-RES-*` | Resource descriptor, file, ownership, freeze rules |
| `EF-CHG-*` | Effect classification, coverage, provenance, transaction semantics |
| `EF-BODY-*` | Markdown and body-schema structure |
| `EF-VAL-*` | Validation invocation, capability, completeness, orchestration |
| `EF-QRY-*` | Query invocation, filter/pagination validity, query completeness |

## Codes that recur in review specifically

These are the orchestration-level codes most likely to appear while reviewing
a transition rather than while authoring; the full set (including every
per-domain `EF-ID-*`/`EF-REL-*`/`EF-SUP-*`/`EF-CHG-*`/`EF-BODY-*` finding) is
in `diagnostic-registry.md`.

| Code | Severity | Condition |
|---|---|---|
| `EF-VAL-001` | error | Requested validation scope or invocation is invalid |
| `EF-VAL-002` | error | Trusted transition baseline is invalid |
| `EF-VAL-006` | error | Required Core validator capability is unavailable |
| `EF-VAL-007` | error | Requested validation result is incomplete |
| `EF-VAL-011` | error | Proposed OID is missing/invalid, unresolvable, or has inapplicable parentage |
| `EF-VAL-012` | error | An incomplete working-tree initialization claim exists |
| `EF-QRY-010` | error | Requested history context is unavailable (no CHG-only fallback) |
| `EF-QRY-013` | error | Query cannot produce a complete trustworthy result |
| `EF-QRY-014` | error | A required Artifact ID does not exist for this query kind |

When one of these appears, report it as the reason the requested review could
not be completed as asked (for example: an untrusted or stale `--baseline`,
or a `--proposed` OID that does not resolve) - it is not evidence about the
proposed change's own content, and it must not be reported as if it were.

## Exit codes

All commands use four stable process exit codes (`13-cli-contract.md` §
Exit Codes), with priority `3 > 2 > 1 > 0`:

| Exit | Meaning |
|---:|---|
| `0` | The requested operation completed successfully |
| `1` | Evaluation completed but EF domain findings rejected the result |
| `2` | The requested operation could not complete (invalid invocation, discovery failure, unavailable baseline/proposed commit, missing required input) |
| `3` | Internal implementation failure |

For `ef query *`, exit is simply `0` when `complete: true` and `2` when
`complete: false` - query has no separate validity/warnings axis. For
`ef validate`, `exit_code` in the JSON envelope always matches the process
exit status; report both the JSON fields and the exit code together, and
never round exit `1` (a real domain rejection) down to "looks fine."
