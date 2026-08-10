# Draft Artifact Authoring

Governing use cases: UC-010 through UC-019. Governing specs:
`13-cli-contract.md` § Draft Artifact Creation, `01-artifact-envelope.md`,
`08-artifact-schemas.md`, `04-relations.md`.

## Choosing the right type

Before creating anything, confirm the type matches the kind of knowledge
(UC-016):

| Type token | Artifact | Holds |
|---|---|---|
| `prd` | PRD | Product problem, user need, desired outcome, success criteria |
| `req` | REQ | One observable system contract |
| `adr` | ADR | A significant chosen engineering decision and its trade-offs |
| `pol` | POL | A recurring cross-cutting engineering rule |
| `chg` | CHG | Provenance/rationale/effects of one engineering transaction |

PROJECT is never created with `ef artifact create` - it exists only from
`ef init` (see `references/project-init.md`).

If a candidate requirement, decision, or policy statement is not already an
explicit human decision, do not silently pick one. Present 2-3 concrete
options and let the human choose before you write the file.

## Creating the draft

```bash
ef artifact create req \
  --title "Search Result Filtering" \
  --summary "Search results must support filtering by supported criteria." \
  --format json \
  --no-input \
  --dry-run
```

Always `--dry-run` first and show the human the resulting `ef/mutation-result@1`
envelope (`changes[]` path, the `artifact` summary with its allocated ID).
Only after confirmation, re-run with `--yes` in place of `--dry-run`:

```bash
ef artifact create req \
  --title "Search Result Filtering" \
  --summary "Search results must support filtering by supported criteria." \
  --format json \
  --no-input \
  --yes
```

`<type>` is one of `prd`, `req`, `adr`, `pol`, `chg`. `--title` and
`--summary` are both required in non-interactive mode; never infer them from
a filename, repository name, or other generated prose. `--project
<project-root>` may be added when needed.

The command allocates the next provisional ID itself, writes exactly one new
file with `status: draft`, all nine envelope fields, empty `tags: []`,
`relations: []`, `resources: []`, and the type's required (possibly empty)
H2 headings. It refuses to overwrite any existing path or ID - a name/ID
collision is a domain rejection (exit `1`), not something to retry with a
different flag.

There is no `edit` (or delete, activate, retire, supersede) subcommand under
`ef artifact`. Once the file exists, open it directly and edit YAML frontmatter and
Markdown body with ordinary file edits. Draft edits need no CHG (UC-018) -
right up until the moment the Artifact's content is active; see
`references/chg-planning.md` for that boundary.

## Filling in the envelope

Field order is fixed and meaningful only for canonical formatting (a
mis-ordered field is a warning, not an error) - always still emit them in
this order:

```text
schema
type
id
title
status
summary
tags
relations
resources
```

- `tags`: array of `^[a-z0-9]+(?:[._-][a-z0-9]+)*$` strings, unique, bytewise
  sorted; empty is `[]`.
- Never add an `x-*` extension field unless the human explicitly asked for
  one, and only with a real namespace (`x-acme-owner-team`, not `x-owner`).

## Filling in the body

Every core H2 heading must appear exactly once, in the fixed order, with no
H1 and no content before the first H2. Draft status permits headings present
but empty/incomplete; custom H2 sections (if any) come after all required
core sections.

| Type | Required H2 headings, in order |
|---|---|
| PRD | Problem, User Need, Desired Outcome, Success Criteria, Non-goals |
| REQ | Requirement, Rationale, Acceptance Criteria |
| ADR | Context, Decision, Alternatives, Consequences |
| POL | Policy, Scope, Rationale, Compliance |
| CHG (draft) | no fixed required headings yet; see `references/chg-planning.md` for the four sections required at completion/retirement |

`Success Criteria` (PRD), `Acceptance Criteria` (REQ), and `Compliance` (POL)
each need at least one non-empty Markdown list item once the Artifact is
active - draft may leave them empty. A section containing only `TODO`,
`TBD`, or `Lorem ipsum` never counts as meaningful active content.

## Relations (UC-014)

Add relations directly in frontmatter, in the source Artifact's own file,
using the narrowest applicable type. Allowed outgoing types per source type:

| Source | Allowed outgoing relation types |
|---|---|
| PROJECT | `references` |
| PRD | `derived-from`, `governed-by`, `superseded-by`, `references` |
| REQ | `derived-from`, `governed-by`, `superseded-by`, `references` |
| ADR | `addresses`, `governed-by`, `superseded-by`, `references` |
| POL | `derived-from`, `superseded-by`, `references` |
| CHG | `governed-by`, `references`, `introduces`, `modifies`, `retires` |

Relations are entries `{ type, target }`, sorted by `(type, target)`, target
an exact same-project ID, no self-edges, no duplicate pairs. `introduces`,
`modifies`, and `retires` are written only by a CHG describing a real
transaction - never write them by hand on a non-CHG file, and never write
them speculatively on a draft CHG (see `references/chg-planning.md`).
Incoming relations are always derived by query, never stored on the target.

## Resources (UC-015)

A Resource descriptor lives on its one owning Artifact's `resources: []`.
For local content: place the file under
`.engineering/resources/<OWNER-ID>/`, add a complete descriptor (`type`,
`location`, `role`, `media_type`, `normative`, `description`) with the
project-relative `location` pointing at it. Use a local Resource for anything
normative; use an `https://` (or `http://`) URL only for a non-normative
external `reference` - Core never fetches it and it can never be
`normative: true`. A draft owner's Resources can be added/edited freely; once
the owner is active, Resource changes fall under the same CHG boundary as any
other active content change.

## Guardrails

- Never create PROJECT, or an Artifact of the wrong type for the knowledge
  being recorded.
- Never invent a term, requirement, decision, or compliance rule the human
  has not approved - draft the candidate wording and ask.
- Never try to repair a provisional ID collision by hand-picking a "safer"
  number; UC-011's collision-repair path (assign a fresh never-issued ID,
  rename the file, update every reference before integration) belongs to a
  human/author decision this Skill surfaces, not an automated guess.
- Never delete an issued file. There is no delete command, and none should be
  approximated with `rm`.
