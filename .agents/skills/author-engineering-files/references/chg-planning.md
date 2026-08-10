# CHG Planning

Governing use cases: UC-030 through UC-034. Governing specs:
`07-change-transactions.md`, `08-artifact-schemas.md` § CHG,
`13-cli-contract.md` (which defines **no** edit, lifecycle, CHG-completion,
Resource-mutation, relation-mutation, or migration command - every step
below is a direct file edit, not a CLI subcommand).

## Decide whether a CHG is required

Everything in this section presumes authoritative EF history already exists.
Before the first authoritative bootstrap integration, the bootstrap
exception applies instead (see `references/existing-project-bootstrap.md`):
the entire initial state, including PRD/REQ/ADR/POL entering as `draft` or
`active`, needs no CHG. That exception ends permanently at the first
integration.

A CHG is **required** for any of:

- creating an Artifact directly as `active`;
- `draft -> active`;
- `active -> superseded`;
- `active -> retired`;
- any content change (even a spelling fix) to an active Artifact's
  frontmatter, body, tags, relations, or Resource descriptors;
- any change to a local Resource owned by an active Artifact;
- any PROJECT content or Resource change, including Terminology;
- any `.engineering/ef.yaml` or `.engineering/.gitignore` change (attributed
  to PROJECT);
- any atomic supersession operation.

There is no editorial exemption. A typo fix on an active REQ needs a CHG the
same as a rewritten contract - never silently "just fix" active content.

A CHG is **not required** (may still be recorded for provenance, but doesn't
have to be) for:

- creating or editing a draft Artifact;
- `draft -> retired`;
- creating, editing, or retiring a draft CHG;
- the atomic project bootstrap state, before its first authoritative
  integration - `ef init`'s own output plus any initial draft/active
  knowledge authored per `references/existing-project-bootstrap.md`;
- pre-integration provisional-ID collision repair.

When unsure whether a target is "active," check its `status` with `ef query
lookup <id> --projection summary --format json --no-input` (see
`references/context-discovery.md`) before deciding.

## Author the CHG record

1. Create the draft CHG file:

   ```bash
   ef artifact create chg \
     --title "<text>" \
     --summary "<text>" \
     --format json --no-input --dry-run
   # then, after human confirmation:
   ef artifact create chg \
     --title "<text>" \
     --summary "<text>" \
     --format json --no-input --yes
   ```

2. Directly edit every affected Artifact, relation, Resource, and
   PROJECT-owned control file so the complete proposed tree is coherent as
   one transaction. This is ordinary file editing - there is no CLI mutation
   command for it.
3. Write the effect relations on the CHG file itself, one per changed
   required target, classified from net before/after state:

   | Effect | Before | After |
   |---|---|---|
   | `introduces` | target absent | target present |
   | `modifies` | target present | present, changed, not newly retired |
   | `retires` | target present, not retired | target `retired` |

   Rules: at most one effect per target per CHG; an unchanged target is never
   listed as an effect (use a `references` relation for context instead); two
   CHGs completing in the same integration boundary cannot claim the same
   target; a CHG never uses `introduces`/`modifies`/`retires` against another
   CHG or against itself.

4. Write the four required completed-CHG body sections, in order, each
   exactly once:

   ```text
   ## Rationale
   ## Sources
   ## Changes
   ## Verification
   ```

   - `Rationale`: non-empty Markdown explaining the transaction.
   - `Sources`: at least one non-empty list item (product input, incident,
     issue, PR, existing behavior, research, regulation, or a direct
     maintainer decision). Never fabricate a source - ask the human what
     motivated the change if it isn't already evident from context gathered
     in `references/context-discovery.md`.
   - `Changes`: at least one non-empty list item describing added, modified,
     removed, moved, or descriptor-changed Artifacts/Resources in
     human-readable form.
   - `Verification`: first non-empty paragraph is exactly `Result: passed` or
     `Result: not-applicable` (lowercase, case-sensitive). `passed` needs at
     least one list item describing a performed check; `not-applicable`
     needs a non-empty rationale paragraph after the marker. Never write
     `Result: passed` unless a check actually ran and passed - this is a
     human/CI attestation that EF preserves but does not itself prove.

5. Set the CHG's `status: completed` only once every criterion above is
   satisfied and you are ready to validate the transition (see
   `references/validation-and-diagnostics.md`).

## Retiring an unfinished CHG instead (UC-033)

If the work is abandoned rather than completed: set `status: retired`,
remove/avoid any factual effect relations (a retired CHG must have none),
and write the same four sections with:

- `Rationale` explaining why work stopped;
- `Sources` with at least one item;
- `Changes` stating that no authoritative effects were applied (planned or
  attempted work may still be described);
- `Verification` beginning `Result: not-completed` with an explanation.

Failed, cancelled, rejected, and abandoned work all use `retired` - there is
no separate status for each. Never set `retired` to erase effects that
already entered authoritative history; that is a repository integrity
violation requiring a corrective transaction, not a status edit.

## Batching multiple CHGs (UC-032)

Multiple independent completed CHGs may enter one integration boundary only
when their effect target sets are completely disjoint - no two completed
CHGs may claim the same target, and no CHG may emit two effect kinds for one
target.

## What this Skill does not do

- It does not publish, commit, or move any branch ref. `ef validate` (next
  step) never authorizes or performs publication; that boundary belongs to
  the human/CI integration operation described in `13-cli-contract.md` §
  Engineering Transaction Boundary, outside this Skill and outside the `ef`
  CLI itself.
- It does not decide for the human whether a rationale is adequate or a
  verification claim is true - those are attestations, not something
  deterministic validation proves.
