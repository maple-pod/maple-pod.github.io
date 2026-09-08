# Validation Recipes

Governing use cases: UC-040-UC-045, UC-064. Governing specs:
`13-cli-contract.md` § Validation Command, `09-validation.md`.

## Command shape

```text
ef validate [--scope snapshot|transition|bootstrap|range]
  --baseline <full-commit-oid>
  --proposed <full-commit-oid>
  --strict
  --warnings-as-errors
  --workspace
  --format human|json
  --no-input
  --no-color
  --project <project-root>
```

The default scope is `snapshot`. Options that do not apply to a command are
an invalid invocation, not something silently ignored - never pass
`--baseline` with snapshot or bootstrap scope, and never pass `--proposed`
with snapshot scope.

## The candidate -> validate -> integrate boundary

A conforming EF change follows this lifecycle: author the working tree,
snapshot-validate it, create a candidate commit WITHOUT moving the
authoritative `integration_ref`, validate that exact candidate commit with
bootstrap or transition scope, then publish by advancing `integration_ref`
to it with one atomic conditional ref update (baseline as the expected old
value, the candidate as the new value). This Skill only ever performs the
validation step - never the commit, the ref update, or any other mutation
(see "Non-negotiable rules" in `SKILL.md`). Understanding the surrounding
steps still matters for a correct review:

- If `integration_ref` has already been advanced to the commit under review
  before transition/bootstrap validation of it ever succeeded, the boundary
  EF is designed to enforce has already been bypassed. Say so explicitly
  rather than treating a validation run against that state as if it still
  proved a pre-publication check - by definition it did not run before
  publication.
- A transition/bootstrap result is only trustworthy for publication as long
  as `integration_ref` has not moved since. If the requester reports (or
  `expected_ref_oid` shows) that the ref has since moved past the validated
  baseline, treat the earlier result as STALE: it proved a boundary that no
  longer matches the ref's current tip, and it must be re-run against the
  new baseline before anything is published against it.
- The candidate commit under review does not need to be checked out, and a
  single-maintainer repository normally has no separate branch to check it
  out onto. Pass `--project <repo-root>` naming the exact Git worktree root
  and the full `--baseline`/`--proposed` OIDs; commit-bound
  transition/bootstrap validation reads authoritative configuration and
  content directly from those commits via Git, not from files on disk, so
  the working tree can legitimately still be at the pre-candidate state
  while this Skill reviews the candidate.

## Reviewing a proposed transition (the primary review command)

```bash
ef validate \
  --scope transition \
  --baseline <full-baseline-commit-oid> \
  --proposed <full-proposed-commit-oid> \
  --strict \
  --format json \
  --no-input
```

- `--baseline` is required for transition scope and invalid for snapshot or
  bootstrap scope. It accepts only a full commit OID for the project
  repository's object format (SHA-1 or SHA-256) - never a branch name, short
  OID, `HEAD`, or working-tree state.
- `--proposed` is required for transition scope (and for bootstrap scope) and
  invalid for snapshot scope. Its first parent MUST equal `--baseline`.
- Add `--workspace` only when the requester also wants
  `11-filesystem-and-config.md` workspace-layout checks folded into the
  requested scope; it does not redefine snapshot, transition, bootstrap, or
  strict mode.
- Use `--strict` by default for a review. Strict mode implies
  `--warnings-as-errors` and additionally requires every Core check for the
  requested scope to be available - if a required capability or context is
  unavailable, the result is incomplete rather than a quietly weakened pass.
  Only skip `--strict` when the requester explicitly asks for a non-strict
  read, and say so when reporting the result.

### What "trusted baseline" means

`--baseline` is not just "some earlier commit that looks right." The
validator materializes that commit, reads its fixed `integration_ref`, and
verifies that ref resolved to the same OID when the operation began; it then
rejects a proposed commit whose `integration_ref` differs. An arbitrary
historical revision is not a trusted baseline even if the command still
executes against it.

Before running transition validation, confirm with the requester which ref
(for example `refs/heads/main`) `--baseline` is the tip of. If they cannot
state this, or offer a commit that is not the actual current tip of the
project's configured integration branch, stop and ask rather than validating
against an untrusted comparison point - a "successful" transition result
against the wrong baseline proves nothing about the real proposed change.

### CI-parity command

Authoritative CI runs, and this Skill should reproduce for an equivalent
review, exactly:

```bash
ef validate \
  --scope transition \
  --baseline <full-commit-oid> \
  --proposed <full-commit-oid> \
  --strict \
  --format json \
  --no-input
```

This is read-only, deterministic, network-free, and independent of TTY state.
It validates the complete proposed commit tree; there is no changed-files-only
mode. It does not require caches and never publishes.

## Reviewing the current tree without a transition (snapshot)

```bash
ef validate --scope snapshot --format json --no-input
```

Use this only to check that the current on-disk tree is internally valid
(for example while iterating on a draft, or as an editor-style check). Never
present a snapshot result as proof that a transition, lifecycle change, or
CHG is legal - see "Snapshot vs. transition" in `SKILL.md`.

## Reviewing a first-time bootstrap

```bash
ef validate --scope bootstrap --proposed <full-commit-oid> --format json --no-input
```

`--baseline` is invalid in bootstrap scope. Use this only when the requester
is reviewing a repository's very first EF state (no prior authoritative EF
history on the configured integration ref) - not for an ordinary change
review.

## Reviewing a multi-commit range

```bash
ef validate --scope range \
  --baseline <full-range-baseline-commit-oid> \
  --proposed <full-proposed-commit-oid> \
  --format json --no-input
```

Use this instead of reviewing each proposed commit separately with repeated
transition/bootstrap calls when the requester's change is a fast-forward
containing more than one new first-parent commit. `--baseline` is optional
for range scope - omitting it is an explicit assertion that
`integration_ref` was proven unresolved at operation start (for example
bootstrapping a brand-new integration ref before any commit has ever been
published to it) and the result is invalid if that assertion does not hold.
A complete range result's diagnostics MAY carry `commit_oid`, attributing a
finding to the one candidate commit it was found at; see
`references/diagnostics.md`. See
`docs/planning/03-ci-recipe-github-actions-range-validation.md` for the full
CI recipe: candidate selection for a required `pull_request`/`merge_group`
check, and the operation-start ref capture that check depends on.

## Reading the JSON envelope

`--format json` (which implies `--no-input`) produces exactly one
`ef/validation-result@1` object on stdout:

```json
{
	"schema": "ef/validation-result@1",
	"kind": "validation",
	"scope": "transition",
	"baseline_oid": "0123456789abcdef0123456789abcdef01234567",
	"proposed_oid": "fedcba9876543210fedcba9876543210fedcba98",
	"integration_ref": "refs/heads/main",
	"expected_ref_oid": "0123456789abcdef0123456789abcdef01234567",
	"strict": true,
	"warnings_as_errors": true,
	"workspace": false,
	"complete": true,
	"valid": true,
	"counts": { "error": 0, "warning": 0, "info": 0 },
	"exit_code": 0,
	"diagnostics": []
}
```

Report these fields verbatim before adding any commentary:

- `complete` - whether the run had the context and capability required by
  the requested scope and policy. A complete transition requires non-null
  `baseline_oid` and `proposed_oid`, and `expected_ref_oid == baseline_oid`.
- `valid` - whether the evaluated repository content satisfied every
  checked invariant. Distinct from `complete`: a run can be complete and
  invalid (a real domain rejection), or incomplete regardless of validity.
- `counts` - `error` / `warning` / `info` diagnostic totals.
- `exit_code` - exactly matches process exit status; see
  `references/diagnostics.md` for the four stable exit codes.
- `diagnostics` - the array to work through with
  `references/diagnostics.md`.

Never paraphrase around a `false` `complete` or `valid` value, and never
report a change as acceptable when either is `false` or `exit_code` is
non-zero.
