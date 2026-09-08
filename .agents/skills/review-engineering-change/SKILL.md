---
name: review-engineering-change
description: Review a proposed EF Core engineering change (a Git transition between an explicit baseline and proposed commit, or an existing PRD/REQ/ADR/POL/CHG Artifact) using only the read-only `ef` CLI - `ef validate`, `ef query *`, and `ef resource read`. Runs `ef validate --scope transition` against explicit full baseline/proposed commit OIDs, inspects impact, history, relations, and supersession, and explains the resulting deterministic diagnostics. Use when asked to review, audit, approve, or explain the validation result for an EF engineering change, pull request, or CHG before merge.
---

# Review Engineering Change

`ef` is the deterministic ground truth for EF Core state. This Skill is a
read-only workflow layer over it: it sequences the existing `ef validate` and
`ef query *` / `ef resource read` commands to review a proposed engineering
change. It never reimplements EF parsing, lifecycle, graph, or CHG-effect
logic, and it never invents CLI syntax beyond what `ef help` and the commands
below actually accept.

Never fabricate command output. Every `ef ... --format json` result is one
JSON object on stdout - run the command and read that object; do not guess its
shape or assume a result without executing the command.

## Non-negotiable rules

1. **Stay read-only.** This Skill only ever runs `ef validate`, `ef query
   <kind>`, and `ef resource read`. Never run `ef init` or `ef artifact
   create`, and never create, edit, delete, or format any file, including
   anything under `.engineering/`.
2. **Never checkout, publish, or update a branch.** Do not run `git
   checkout`, `git switch`, `git merge`, `git push`, `git update-ref`, or any
   other command that moves a branch, working tree, or `HEAD`. A passing
   validation result is not publication authorization - the atomic
   baseline-to-proposed compare-and-swap is a separate integration operation
   outside this Skill (`13-cli-contract.md` § Engineering Transaction
   Boundary).
3. **Require explicit, trusted, full commit OIDs for transition review.**
   Never accept a branch name, short OID, `HEAD`, or working-tree state as a
   substitute. Never treat an arbitrary historical commit as a trusted
   baseline. See `references/validation-recipes.md` for what "trusted
   baseline" means and how to confirm it.
4. **Never substitute judgment for the validator.** When `ef validate`
   reports `valid: false` or `complete: false`, explain the returned
   diagnostics; do not reinterpret, soften, or override that result with
   independent reasoning about lifecycle or graph correctness. This Skill
   explains and reviews semantics on top of a validator result - it never
   replaces one.
5. **Distinguish snapshot success from transition proof.** Snapshot
   validation only proves the current tree is internally valid; it cannot
   prove a lifecycle transition was legal, that nothing frozen was deleted or
   mutated, or that a CHG's declared effects are true. Say so explicitly
   whenever a requester conflates the two. See "Snapshot vs. transition"
   below.
6. **Treat a moved `integration_ref` as disqualifying, not as a detail.** If
   the commit under review is already the tip of `integration_ref`, or the
   ref has advanced since a prior transition/bootstrap result was produced,
   that result no longer proves a pre-publication boundary and must not be
   reported as if it does - see "The candidate -> validate -> integrate
   boundary" in `references/validation-recipes.md`. The candidate under
   review does not need to be checked out; pass `--project <repo-root>` with
   the explicit `--baseline`/`--proposed` OIDs instead of asking the
   requester to check it out.

## Workflow

```text
1. Confirm scope and inputs
   -> project root (--project, or upward discovery from cwd)
   -> full --baseline <oid> and full --proposed <oid> for a transition review
   -> if either is missing or the baseline's trust cannot be stated, ask -
      do not guess

2. Run transition validation
   -> references/validation-recipes.md
   -> read complete / valid / counts / exit_code before anything else

3. Explain every diagnostic
   -> references/diagnostics.md
   -> map code / severity / location / related to what it actually means

4. Gather read-only review evidence as needed
   -> references/query-recipes.md
   -> impact, history, relations, trace, resolve-current, lookup, resource read

5. Report the validator's result plus the explained evidence -
   never a substitute pass/fail opinion
```

## Snapshot vs. transition

`ef validate` defaults to `--scope snapshot`. Snapshot validation proves only
that one complete current tree is internally valid: envelopes, identity,
lifecycle-status applicability, relation targets, Resource integrity, body
schemas, and canonical resolution. It **cannot** prove:

- that a lifecycle transition (for example draft to active, or active to
  superseded) was legal;
- that no issued Artifact ID, Resource, or frozen content was deleted or
  mutated after freeze;
- that a CHG's declared effects are true; or
- atomicity of a supersession, split, or consolidation across the whole
  proposed tree.

Only `--scope transition` with both `--baseline` and `--proposed` checks
those. If a requester asks whether a change is safe to merge and only offers
a snapshot result on the proposed tree, say explicitly that snapshot success
does not answer that question, then ask for the trusted baseline OID so
transition validation can run. `--scope bootstrap` is a separate, narrower
exception for a repository's very first EF state; do not use it to review an
ordinary change, and never pass `--baseline` with it.

## Reference index

- `references/validation-recipes.md` - full `ef validate` flag reference for
  snapshot, transition, bootstrap, and range scope; what a trusted baseline
  means; the candidate -> validate -> integrate boundary and how to recognize
  a stale result; the JSON envelope fields; the CI-parity command.
- `references/query-recipes.md` - full `ef query *` and `ef resource read`
  command reference: impact, history, relations, trace, resolve-current,
  lookup, list, search, and the staged context-composition pattern.
- `references/diagnostics.md` - the diagnostic object shape, severity levels,
  exit-code mapping, and the validation/query diagnostic codes most relevant
  to a review.
