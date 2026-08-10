# Existing-Project (Brownfield) Bootstrap

Governing use cases: UC-001, UC-041, UC-043. Governing specs:
`09-validation.md` § Bootstrap exception, `13-cli-contract.md` § Project
Initialization and § Engineering Transaction Boundary.

Use this workflow when a repository has an established codebase - existing
behavior, docs, tests, CI, Git history - but has never used EF: no
`.engineering/` project and no authoritative EF history. For a genuinely new
(greenfield) repository, `references/project-init.md` alone is sufficient.
When the state is ambiguous, ask the human which case applies; never equate
"no `.engineering/`" with "init and bootstrap immediately."

This is a workflow over the existing `ef` commands only. There is no import,
migration, repository-analysis, edit, or activation command in the CLI, and
this Skill never pretends otherwise: repository interpretation happens here,
in the Agent workflow; `ef` stays the deterministic primitive and validator.

## Step 0 - confirm first-time adoption

- The target is exactly an existing Git worktree root.
- `ef query lookup PROJECT --format json --no-input` finds no project
  (`found: false`, or discovery fails because no `.engineering/` exists),
  and the human confirms no authoritative EF history exists elsewhere for
  this repository.
- Confirm the full integration ref (`refs/heads/...`) with the human - never
  guess or default it. Bootstrap validation (Step 8) will prove no prior
  `.engineering/ef.yaml` exists in that ref's history at validation time; if
  EF history already exists there, bootstrap is the wrong workflow entirely.
- Resumption: if a prior session already ran `ef init` (local
  `.engineering/` exists) but the candidate has never been integrated, this
  workflow resumes at the appropriate later step (Step 5-8) instead of
  starting over; never rerun `ef init` in that case. Resumption requires
  the same proof as elsewhere: a valid completed local EF project (a
  partial `.engineering/` - e.g. `ef.yaml` absent or an init marker left
  behind - is EF-VAL-012 / incomplete initialization; stop and surface it
  instead of resuming) plus a proven EF-free or unresolved configured ref
  history. If that proof instead shows the ref now holds authoritative EF
  history, the bootstrap was preempted: do not resume - follow Step 7's
  abort/handoff path instead. If that evidence cannot be inspected, stop
  as incomplete rather than resume.

## Step 1 - bounded, read-only repository archaeology

Before EF exists there is no EF graph to query, so the repository itself is
the only evidence source. This is the **only** situation in which this Skill
gathers broad context by reading repository files directly, and even here the
reading is staged and bounded - never "read every file":

1. Start with high-signal project documents: README, package metadata and
   manifests, existing product or architecture docs, ADR/RFC/decision
   records, contributor and quality docs.
2. From those, list candidate knowledge areas (likely PRD/REQ/ADR/POL
   subjects).
3. Only for those candidate areas, inspect targeted evidence: public APIs
   and externally observable behavior; tests and fixtures (especially
   behavior/contract tests); CI, release, and quality configuration; source
   structure only as needed to understand the established architecture; Git
   history, issues, and PRs only when they materially clarify intent or a
   historical decision.

This phase is strictly read-only: no file edits, no `ef` mutations. Its
license expires the moment the first authoritative EF state is integrated -
after that, the staged queries in `references/context-discovery.md` answer
EF questions, and repository archaeology is never again a substitute for
them.

## Step 2 - separate observation from engineering intent

Never silently convert what the repository does into what the project
intends:

```text
observed implementation behavior != intended requirement
existing dependency/structure    != deliberate architecture decision
lint/configuration setting       != automatically an engineering policy
historical code                  != evidence of historical rationale
```

Everything derived from archaeology is a **candidate**. For each candidate,
retain enough evidence for the human to judge it - conceptually:

```text
Candidate: REQ - <one observable contract>
Evidence: <the docs/tests/APIs that support it>
Uncertainty: <what was not found or remains unconfirmed>
Recommendation: draft or active, with the reason
```

This presentation shape is for the conversation with the human only; it is
not an EF file format and never gets written into Artifact bodies as-is.

## Step 3 - human-confirmed initial knowledge inventory

Propose one complete inventory and let the human accept, edit, or reject
every entry before any `ef` mutation runs. Use the existing Artifact
semantics:

- **PROJECT** - vision, scope, non-goals, context, accepted terminology.
  PROJECT is special: exactly one exists, it is always `active`, and it is
  created only by `ef init` in Step 4 - never by `ef artifact create`. The
  draft/active status boundary below, and the `ef artifact create` loop in
  Step 5, apply only to PRD/REQ/ADR/POL entries.
- **PRD** - a meaningful product problem, user need, or desired outcome; not
  a module inventory.
- **REQ** - one observable system contract; not every function, class, or
  file.
- **ADR** - a significant established decision and its trade-offs; never
  fabricate historical rationale that evidence does not support.
- **POL** - a recurring cross-cutting rule; do not promote every lint or
  config setting into a policy.

Model meaningful engineering truth; do not mirror the source tree, and do
not mechanically over-decompose. Also propose, per accepted PRD/REQ/ADR/POL
entry:

- **status** - see the boundary below;
- **relations** - only where the semantic relationship is supported by
  evidence and the human accepts it, using the narrowest valid type from the
  ontology in `references/draft-authoring.md`. Incoming relations are always
  derived by query, never stored. Never write speculative
  `introduces`/`modifies`/`retires` relations - those belong to a CHG, and
  bootstrap has no CHG;
- **resources** - copy or attach an existing repository document into
  `.engineering/resources/<OWNER-ID>/` only when the human intends it to
  become an EF-owned Resource; never bulk-ingest a docs directory. External
  URLs stay non-normative `reference` Resources per
  `references/draft-authoring.md`.

If the human additionally accepts PROJECT relations (PROJECT's only allowed
outgoing relation type is `references` - see the type table in
`references/draft-authoring.md`) or PROJECT-owned Resources, these do not go
through the loop above: `ef init` has no flags for relations or Resources.
Step 4 materializes PROJECT-owned Resources by direct edit; PROJECT
`references` relations are deferred to Step 5, after the ID allocator
issues their targets' IDs.

### Initial status boundary

- `active` only when the human explicitly accepts the statement as current
  authoritative engineering truth **and** the Artifact satisfies the active
  body requirements in `references/draft-authoring.md`.
- `draft` whenever intent is still uncertain, evidence is incomplete, or
  wording remains under discussion.
- Never `active` merely because the current implementation behaves that way.
- Never synthesize CHG Artifacts to explain pre-EF history so that initial
  active knowledge can exist - the bootstrap exception makes that
  unnecessary by design.

## Step 4 - initialize EF

Reuse only the `ef init` procedure from `references/project-init.md`: its
preconditions to confirm with the human, and its `--dry-run` plan -> human
confirmation -> identical command with `--yes` sequence, using the confirmed
integration ref and the human-accepted PROJECT content from the inventory.
After `init` reports `applied: true`, do not restart any workflow from the
top: return directly here, to Step 5 below. Do **not** stop after `init` and
publish an init-only tree: the bootstrap commit in Step 7 must carry the
complete accepted initial state, not just the skeleton. If the accepted
inventory includes PROJECT-owned Resources, place the Resource files under
`.engineering/resources/PROJECT/` and edit the generated
`.engineering/PROJECT.md` directly now, under the normal schema rules in
`references/draft-authoring.md` - the bootstrap exception permits direct
PROJECT edits only before the first authoritative integration. PROJECT's
owner ID (`PROJECT`) is already known, so its Resources need no allocated
ID. Defer any accepted PROJECT `references` relations to Step 5's relation
application phase instead: their targets are PRD/REQ/ADR/POL Artifacts
whose IDs do not exist until the Step 5 allocator issues them.

## Step 5 - create the accepted initial Artifacts

### Resumption preflight (required before any new mutation)

On a resumed session, before creating anything: inventory the existing
local candidate state with read-only queries, for example:

- `ef query list --format json --no-input`
- `ef query lookup <id> --projection summary --format json --no-input`
  for a specific entry

Then re-establish, with the human, the mapping from accepted inventory
entries to already-allocated Artifact IDs/files.

- Preserve every already-created provisional file/ID; create a skeleton
  only for an accepted entry proven not yet materialized.
- If the mapping is ambiguous - it cannot be proven whether an entry was
  already created - ask the human; never match by title, and never
  allocate another ID for a possibly-existing concept.
- This preflight also determines how far the flow already progressed
  (bodies filled? relations applied? snapshot validated? candidate commit
  built?), so the resumed session continues from the right step below
  instead of replaying earlier mutations.

Allocate every Artifact ID before any relation references it; apply
relations only after all IDs exist. For each accepted PRD/REQ/ADR/POL
inventory entry, create the file through the CLI first. Here `<type>` is
one of `prd`, `req`, `adr`, `pol` - never `chg` during bootstrap, and
PROJECT is never created this way:

```bash
ef artifact create <type> \
  --title "<text>" \
  --summary "<text>" \
  --format json \
  --no-input \
  --dry-run
# show the plan; after human confirmation, identical command with --yes:
ef artifact create <type> \
  --title "<text>" \
  --summary "<text>" \
  --format json \
  --no-input \
  --yes
```

1. The command always writes a `status: draft` skeleton; `--dry-run`
   reserves no ID, and there is no explicit-ID creation path. Repeat this
   create step for every accepted entry, recording each actually allocated
   ID from its applied `--yes` result - never guess or pre-assign a future
   ID.
2. Once every accepted entry has a file and a recorded ID, fill frontmatter
   and body with ordinary file edits per `references/draft-authoring.md`
   (there is no edit or activation command). For entries the human accepted
   as initial **active** truth, edit the file directly into a valid active
   state (status plus complete required sections). The bootstrap contract
   explicitly permits this before the first authoritative integration; it
   is **not** a precedent for bypassing CHG afterwards. Add the accepted
   Resources.
3. With every ID now known, apply the accepted cross-Artifact relations by
   direct edit - the PROJECT `references` relations deferred from Step 4
   (edit `.engineering/PROJECT.md`) and every other accepted relation (edit
   the owning Artifact file) - using exactly the recorded IDs, never a
   guessed or future one.

Never create a CHG, `superseded`, or `retired` Artifact anywhere in the
bootstrap state.

## Step 6 - validate the complete working tree

```bash
ef validate --scope snapshot --format json --no-input
```

Run the fix-reverify loop from `references/validation-and-diagnostics.md`
until the complete initial graph is valid.

## Step 7 - one complete candidate bootstrap commit

Have the human (or their ordinary Git tooling) create exactly one commit
containing the complete candidate `.engineering/` tree.
`ef validate --scope bootstrap` resolves the configured integration ref
fresh when it runs, so place the candidate against the ref's state as
observed immediately before building it, not against any earlier
observation: if the ref resolves at that moment, the candidate's first
parent must be exactly its current tip commit; if it does not resolve, the
candidate must be a root commit, or its first-parent history before the
candidate must contain no `.engineering/ef.yaml` path.

Any change to the ref's state between building the candidate and
validating or integrating it - an unresolved ref becoming resolved, a
resolved tip moving, or otherwise - requires re-inspecting the fresh state
before acting further:

- If the fresh first-parent history is still EF-free, the candidate is
  merely stale: rebuild or amend the single candidate against the fresh
  state and bootstrap-validate its new full OID; never stack another
  commit on top.
- If the fresh history now contains an EF state (an `EF-VAL-009`-class
  history finding) - whether discovered here or already true when a
  resumed session enters at Step 0, or via the top-level routing in
  SKILL.md - abort brownfield bootstrap entirely: report to the human that
  authoritative EF history now exists. Before any EF context query or CHG
  planning, have the human (or their ordinary Git tooling) first preserve
  this actor's unintegrated candidate work separately (e.g. on its own
  branch), then materialize a working tree based on the actual current
  authoritative `integration_ref` state - this Skill still never checks
  out, resets, or publishes anything itself, but the handoff must be
  explicit. Only once the working tree reflects the authoritative EF
  state, reconcile whatever of the preserved intent is still wanted
  through the established-EF workflow: context discovery via
  `references/context-discovery.md`, then CHG-backed transitions via
  `references/chg-planning.md`. Never keep re-parenting the candidate to
  chase the bootstrap exception.
- If the ref or its history cannot be inspected, the operation is
  incomplete - never assume eligibility.

This Skill never publishes, commits to, or moves any branch ref - the
transaction boundary of `13-cli-contract.md` stays outside it.

## Step 8 - bootstrap-validate the exact commit

```bash
ef validate --scope bootstrap --proposed <full-commit-oid> --format json --no-input
```

Report `complete`, `valid`, `counts`, `exit_code`, and every diagnostic to
the human. On findings, fix the working tree, then amend, replace, or
rebuild the single candidate bootstrap commit - never append a child commit
on top of the failed candidate, since that moves the first parent off the
ref's tip at validation time (or reintroduces `.engineering/ef.yaml` into
first-parent history) and destroys bootstrap eligibility. Because each run
resolves the integration ref fresh, re-check the ref's current state before
rebuilding: per Step 7, if the fresh history is still EF-free the candidate
is merely stale, so rebuild it against the fresh state and re-run the same
command against the new full commit OID; if the fresh history now contains
an EF state (an `EF-VAL-009`-class finding), stop and follow Step 7's abort
path instead of rebuilding again. Never report a failed bootstrap
validation as done.

## Step 9 - integration ends the bootstrap exception

Integration (UC-043's conditional compare-and-swap) happens outside this
Skill, performed by the human or CI. The state change it causes is permanent
and must never be missed:

```text
before first authoritative EF integration:
  initial PRD/REQ/ADR/POL may become active without CHG

after first authoritative EF integration:
  the bootstrap exception is gone
  active/PROJECT/control-file/Resource changes require the normal
  CHG-backed transition rules in references/chg-planning.md
```

"We are documenting existing behavior" is never again a reason to skip a
CHG once authoritative EF history exists.

## Do not fabricate provenance

The bootstrap is a truthful genesis snapshot, not a reconstruction of
fictional EF history:

- no CHG Artifacts for changes that happened before EF existed, ever;
- no invented dates, sources, decisions, rationale, rejected alternatives,
  or owners;
- when a choice is clearly established but its original rationale is
  unavailable, record only what current evidence or maintainer confirmation
  supports - never a plausible story stated as fact;
- existing historical ADR/RFC/docs may serve as evidence, or be attached as
  Resources under the normal Resource rules, but only with explicit human
  intent.
