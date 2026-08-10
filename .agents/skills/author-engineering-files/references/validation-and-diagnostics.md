# Snapshot Validation and Diagnostic Correction

Governing use cases: UC-040, UC-045. Governing specs:
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
