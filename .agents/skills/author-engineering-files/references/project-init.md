# Project Initialization

Governing use case: UC-001. Governing spec: `13-cli-contract.md` § Project
Initialization.

## When this applies

Run this only when no `.engineering/` project exists yet for the target Git
worktree. If discovery already finds a project (an `ef query lookup PROJECT
--format json` call returns `found: true`), do not run `ef init` again - it
refuses to overwrite or merge with an existing `.engineering` path and exits
`1` as a domain rejection.

For an established (brownfield) codebase adopting EF for the first time,
this file covers only the `ef init` step: Step 4 of
`references/existing-project-bootstrap.md` delegates here for that step
only, then resumes at its own Step 5. That file sequences repository
archaeology and the human-confirmed initial knowledge inventory around the
`ef init` step covered here.

## Preconditions to confirm with the human first

- The target directory is exactly a Git worktree root (not an arbitrary
  subdirectory).
- The full local integration branch ref, e.g. `refs/heads/main` - `ef init`
  requires the complete `refs/heads/...` form, not a short branch name, and
  this ref becomes immutable after bootstrap. Never guess or default this;
  confirm it explicitly even if a branch is already checked out.
- The project `--title` and `--summary`.
- Markdown content for `--vision`, `--project-scope`, `--non-goals`, and
  `--context`. These become the PROJECT body sections - do not invent
  substantive project scope or non-goals; draft candidate wording and have
  the human confirm or edit it.
- Optionally, a `--terminology` Markdown table of accepted terms. Only
  include terms the human has explicitly approved; when in doubt, omit the
  flag entirely and let `ef init` emit the canonical empty Terminology table
  (header row, zero data rows) for the human to fill in later as a draft
  edit. For brownfield adoption, accepted terms come from the terminology
  candidates proposed in Step 3 of `references/existing-project-bootstrap.md`
  - not from silently promoting observed repository vocabulary. Rows MUST
  follow the canonical Terminology content and row-ordering rules in
  `references/draft-authoring.md` (NFC term text, unique after trimming,
  sorted by trimmed UTF-8 byte sequence).

## Command

Non-interactive invocation, run in two steps:

```bash
ef init \
  --title "<text>" \
  --summary "<text>" \
  --vision "<markdown>" \
  --project-scope "<markdown>" \
  --non-goals "<markdown>" \
  --context "<markdown>" \
  --integration-ref "refs/heads/<branch>" \
  --format json \
  --no-input \
  --dry-run
```

1. Run with `--dry-run` first. `--dry-run` does not require `--yes` and never
   writes. Read the resulting `ef/mutation-result@1` envelope
   (`kind: "init"`, `applied: false`, `changes[]`) and show it to the human
   before proceeding.
2. Only after the human confirms the plan, re-run the identical command with
   `--dry-run` replaced by `--yes`:

   ```bash
   ef init \
     --title "<text>" \
     --summary "<text>" \
     --vision "<markdown>" \
     --project-scope "<markdown>" \
     --non-goals "<markdown>" \
     --context "<markdown>" \
     --integration-ref "refs/heads/<branch>" \
     --format json \
     --no-input \
     --yes
   ```

`--project <project-root>` may be added to either invocation when the
worktree root is not the current directory; it must be exactly an existing
Git worktree root or the invocation is incomplete.

## What gets created

Exactly one new `.engineering/` directory containing `ef.yaml`, a canonical
`.gitignore`, an active `PROJECT.md` (all nine envelope fields, `status:
active`, no `Lifecycle` section), the canonical Artifact directories, and the
managed Resource directory. `linked_repositories: []` is always serialized
even for a single-repository project (see `references/draft-authoring.md`
for envelope field order rules that also apply to PROJECT).

## After `init` reports `applied: true`

`ef init` only publishes files to the working tree - it does not commit, and
it never updates any branch ref itself.

If this is brownfield adoption and initial PRD/REQ/ADR/POL knowledge still
needs capturing, do not commit or bootstrap-validate the init-only tree yet:
return to Step 5 of `references/existing-project-bootstrap.md` (do not
re-enter that workflow from the top, and do not run `ef init` again) and
produce one complete candidate initial EF state first.

Otherwise (greenfield, nothing further to capture), tell the human the next
steps are theirs to perform through ordinary Git and CI, matching
UC-001/UC-043:

1. Commit the candidate `.engineering/` tree.
2. Validate it as a bootstrap:

   ```bash
   ef validate --scope bootstrap --proposed <full-commit-oid> --format json --no-input
   ```

3. Only a conforming integration operation outside this Skill's scope
   performs the actual atomic compare-and-swap branch update described by
   `13-cli-contract.md` § Engineering Transaction Boundary. This Skill does
   not publish branches.

## Guardrails

- Never pass a short branch name (`main`) as `--integration-ref`; it must be
  the full `refs/heads/...` ref, and there is no hard-coded default.
- Never retry `ef init` against a directory where a previous attempt may have
  left a partial `.engineering/` (with or without an initialization marker).
  That state is a domain finding, not something this Skill repairs - surface
  it to the human as `EF-VAL-012` / an incomplete initialization and stop.
- Never write `--terminology` rows that the human has not approved.
- `ef init` never runs `git init`, clones anything, or touches unrelated
  project files.
