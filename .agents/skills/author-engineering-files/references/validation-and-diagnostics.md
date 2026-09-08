# Snapshot Validation and Diagnostic Correction

Governing use cases: UC-040, UC-041, UC-042, UC-043, UC-045. Governing specs:
`13-cli-contract.md` § Validation Command, `09-validation.md`.

## Always finish with snapshot validation

After any authoring session that touched the working tree (a new draft, a
draft edit, or a CHG-backed active change), run:

```bash
ef validate --scope snapshot --format json --no-input
```

`--scope` defaults to `snapshot` if omitted, but pass it explicitly for
clarity. Add `--project <project-root>` if not run from inside the worktree.
Snapshot validation is read-only and network-free; it never repairs,
formats, or migrates anything.

Only use `--scope transition` when the human explicitly wants an
integration-boundary check with both a trusted baseline and proposed commit
(`--baseline <full-oid> --proposed <full-oid>`), and only `--scope bootstrap`
with `--proposed <full-oid>` for the very first EF state before any CHG
exists. Do not substitute transition/bootstrap scope for an ordinary
authoring-session check, and never fall back from transition to snapshot
silently - if `--baseline`/`--proposed` are missing in transition scope the
command exits `2`; that is correct incomplete behavior, not a bug to route
around.

`--strict` (implies `--warnings-as-errors`) and `--workspace` may be added
when the human wants the strictest applicable policy, but do not add them by
default - default policy (fail only on errors) is the baseline behavior this
Skill assumes unless told otherwise.

## Reading the result

The JSON envelope is `ef/validation-result@1` with, among other fields,
`complete`, `valid`, `counts: { error, warning, info }`, `exit_code`, and
`diagnostics: []`. Each diagnostic has at least `code`, `severity`,
`message`, and, when applicable, `path`, `artifact_id`, `location: { line,
column }`, `field`, `section`, and `related: []`.

## Exit-code model

| Exit | Meaning | What to do |
|---:|---|---|
| `0` | Completed and valid under the selected policy | Report success; nothing to fix |
| `1` | Completed, but domain findings reject the result (errors, or warnings under warnings-as-errors/strict) | Read every diagnostic, fix the named files, re-run |
| `2` | The requested validation could not complete (invalid invocation, project-discovery failure, missing/unavailable baseline or proposed commit, unavailable capability) | Fix the invocation or environment issue described, not the repository content |
| `3` | Internal validator failure | Report the defect; do not attempt a content fix |

Never tell the human "validation passed" unless `exit_code` is `0` (or `1`
with only warnings the human has explicitly decided to accept under default,
non-warnings-as-errors policy - and even then, state plainly that warnings
remain). Never treat exit `2` as if it were a content problem, and never
treat exit `1` as if it were a tooling problem you can dismiss.

## The fix-reverify loop

For each diagnostic in `diagnostics[]`, in the order the tool already
returned them (they are already deterministically sorted by severity, path,
line, column, code):

1. Open exactly the file named by `path` (project-relative; do not guess a
   different file).
2. Use `location.line`/`location.column` and `field`/`section` to find the
   exact spot. `related[]` entries point at other participating locations
   (e.g. the other side of a duplicate ID or a cycle) - read those too before
   editing.
3. Fix the underlying repository content directly. Do not:
   - reformat or "helpfully" restructure unrelated content while you're in
     the file;
   - suppress, filter, or reinterpret the diagnostic's severity;
   - change validator flags (`--strict`, `--warnings-as-errors`) to make a
     finding disappear instead of fixing the content;
   - invent a plausible-sounding fix for something that requires a human
     decision (e.g. an ambiguous relation target, a genuinely disputed
     rationale) - ask instead.
4. After fixing every diagnostic you can address directly, re-run the exact
   same `ef validate` command (same scope and flags) and re-read the new
   result. Do not assume a fix worked without re-running.
5. Repeat until `exit_code` is `0`, or the remaining diagnostics require a
   human decision this Skill has surfaced and is waiting on.

A primary diagnostic can suppress dependent ones (e.g. a parse failure
suppresses missing-field checks for that same file). Fixing the primary
diagnostic and re-running is the only way to see whether secondary problems
exist - do not manually predict them from the spec instead of re-running the
validator.

## The candidate -> validate -> integrate lifecycle

Snapshot validation only proves the current working tree is internally
consistent by itself. Publishing a change safely requires proving that one
exact proposed *commit* is a legal bootstrap or transition from a trusted
baseline, then advancing `integration_ref` atomically to that commit. Follow
this order; do not skip or reorder a step:

1. Finish authoring in the working tree and drive it to
   `ef validate --scope snapshot --format json --no-input` `exit_code: 0`
   (the loop above).
2. Create the candidate commit (for example `git commit`) WITHOUT moving the
   authoritative `integration_ref` (for example `refs/heads/main`). The
   candidate's parent is the current trusted baseline; the ref itself has
   not moved yet, and it MUST NOT move before the next step succeeds.
3. Validate that exact candidate commit - not the working tree - with
   `--scope bootstrap` (no prior EF state exists on the integration ref) or
   `--scope transition` (an EF state already exists):

   ```bash
   ef validate --scope transition \
     --baseline <trusted-baseline-oid> \
     --proposed <candidate-commit-oid> \
     --strict --format json --no-input
   ```

   or, for a repository's very first EF state:

   ```bash
   ef validate --scope bootstrap \
     --proposed <candidate-commit-oid> \
     --format json --no-input
   ```

   Pass `--project <repo-root>` pointing at the exact Git worktree root so
   this works even when the checked-out working tree does not (and should
   not yet) materialize the candidate's `.engineering` state: commit-bound
   `transition`/`bootstrap` validation reads authoritative configuration and
   content directly from the supplied commit(s) via Git, not from files on
   disk, so `--project` only needs to identify which worktree's `.git` to
   read through. This is the way to validate a candidate commit from a
   pre-candidate checkout - including a single-maintainer repository that
   normally commits straight to its integration branch and would otherwise
   have no separate branch to check out.
4. Only after that validation reports `exit_code: 0`, publish by advancing
   `integration_ref` to the candidate commit with one atomic conditional ref
   update (a compare-and-swap): the update MUST be conditioned on the ref
   still being at the exact baseline OID validation just proved, not applied
   unconditionally. For a local Git integration ref, prefer the CAS-shaped
   form:

   ```bash
   git update-ref <integration-ref> <candidate-commit-oid> <trusted-baseline-oid>
   ```

   `git update-ref <integration-ref> <candidate-commit-oid>` alone (with no
   expected-old-value), `git branch -f`, or a plain `git push` without an
   equivalent expected-old-value guard do not prove the ref had not already
   moved and are not conforming substitutes.
5. If that conditional update fails, or you otherwise observe that
   `integration_ref` advanced between steps 1-3 and step 4, the validation
   from step 3 is now STALE: it proved a bootstrap/transition from a
   baseline that is no longer the ref's actual tip. Do not publish an
   already-validated candidate against a ref that has since moved. Rebuild
   the candidate against the new tip (or re-resolve the new trusted
   baseline) and re-run step 3 before attempting to publish again.

Moving `integration_ref` before transition/bootstrap validation of the
candidate commit succeeds bypasses the boundary EF is designed to enforce:
once the ref already points at the proposed state, transition/bootstrap
validation can no longer prove the original pre-publication boundary (the
class of failures reported as `EF-VAL-002` or `EF-VAL-009`). This applies
even to a single-maintainer repository that normally commits directly to its
integration branch - the candidate commit must exist and pass bootstrap or
transition validation before the branch pointer advances, never after.

## Integrating multiple commits at once: range scope

When the candidate is not one commit but a fast-forward containing several
new first-parent commits (several batched commits about to be integrated at
once), validate the whole thing as one integration range instead of walking
each commit one at a time with repeated `--scope transition`/`--scope
bootstrap` calls:

```bash
ef validate --scope range \
  --baseline <trusted-range-baseline-oid> \
  --proposed <proposed-tip-commit-oid> \
  --format json --no-input
```

Like every other step in the lifecycle above, this never requires moving
`integration_ref` to validate: the ref only advances after this reports
`exit_code: 0`, and only via the same conditional ref update from step 4. See
`docs/planning/03-ci-recipe-github-actions-range-validation.md` for the full
CI recipe: candidate selection for a required `pull_request`/`merge_group`
check, and the operation-start ref capture that check depends on.

## Editor/CI equivalents

The same JSON contract backs editor and CI use, so the identical command is
safe to suggest there too:

```bash
ef validate --scope snapshot --format json --no-input
ef query lookup REQ-031 --projection full --format json
```

CI transition checks use `--scope transition --baseline <oid> --proposed
<oid> --strict --format json --no-input`, but this Skill only recommends
that when the human is actually working on a CI transition-validation task,
not as the default end-of-session check.
