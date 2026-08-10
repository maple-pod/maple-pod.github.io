---
name: author-engineering-files
description: Author and maintain EF Core engineering files (PROJECT, PRD, REQ, ADR, POL, CHG) under `.engineering/` through the deterministic `ef` CLI - initializing a project, bootstrapping EF for an existing (brownfield) codebase, discovering context with staged read-only queries, creating draft Artifacts, planning CHG-backed transitions for active content, and validating the result. Use when the user asks to set up an EF project, introduce/adopt EF in an existing repository or establish its first engineering files, write or edit a PRD/REQ/ADR/POL/CHG file, plan an engineering change, run or fix `ef validate` diagnostics, or otherwise author EF content with `@deviltea/ef`.
---

# Author Engineering Files

`ef` is the deterministic ground truth for EF Core state. This Skill is a
workflow layer over it: it sequences the existing `ef init`, `ef artifact
create`, `ef validate`, `ef query *`, and `ef resource read` commands. It
never reimplements EF parsing, validation, or graph logic, and it never
invents CLI syntax beyond what `ef help` and the commands below actually
accept.

Never fabricate command output. Every `ef ... --format json` result is one
JSON object on stdout - run the command and read that object; do not guess
its shape or assume a result without executing the command.

## Non-negotiable rules

1. **Query before loading or changing broad context.** Once a valid EF
   project exists, never read or edit many files by hand to "get oriented."
   Use the staged composition in `references/context-discovery.md` (`query
   list`/`search`/`impact` -> pick exact IDs -> `resolve-current` if needed
   -> `query lookup --projection full` -> `resource read` only for
   explicitly selected Resources). The single exception is first-time
   brownfield adoption, where no EF state exists to query yet:
   `references/existing-project-bootstrap.md` defines a bounded, read-only
   repository archaeology phase for that case only. After the first
   authoritative EF state is integrated, EF queries answer EF questions -
   never keep using repository archaeology as a substitute.
2. **Drafts are not canonical truth.** A `status: draft` Artifact may be
   created and freely edited with no CHG. Once the first authoritative EF
   state is integrated, any change to *active* content - frontmatter, body,
   tags, relations, Resources, `ef.yaml`, `.gitignore` - requires a
   CHG-backed Git transition, including a one-word typo fix. There is no CLI
   edit, lifecycle, or CHG-completion command: you author these changes
   directly as files. See `references/chg-planning.md`. Single exception:
   during first-time bootstrap, before any authoritative EF integration,
   accepted initial content may be edited directly with no CHG - see
   `references/existing-project-bootstrap.md`.
3. **Never invent terminology or engineering decisions.** Propose candidate
   terms, requirements, decisions, or policy language and ask the human to
   accept, edit, or reject them. Do not write a PROJECT Terminology row, an
   ADR Decision, or a POL Policy statement as settled fact without an
   explicit human choice.
4. **Show the mutation before applying it.** For every `ef init` or `ef
   artifact create` invocation, run it first with `--dry-run` and show the
   plan (`changes[]`, the `artifact` summary). Only after the human confirms
   do you re-run the same command with `--yes`.
5. **Finish every authoring session with snapshot validation.** Once you stop
   editing the working tree, run:

   ```text
   ef validate --scope snapshot --format json --no-input
   ```

   and resolve every diagnostic before telling the human the work is done.
   See `references/validation-and-diagnostics.md` for the exit-code model and
   the fix-reverify loop. Never bypass, downgrade, or reinterpret a validator
   finding - fix the file and re-run validation.

## Workflow

```text
1. Is there an existing .engineering/ project?
   yes -> route by proof, never by assumption (never grant the bootstrap
          exception on ambiguity):
          incomplete initialization claim (partial `.engineering/`, e.g.
          `ef.yaml` absent or an init marker left behind) -> stop; surface
          it to the human as EF-VAL-012 / incomplete initialization (see
          project-init.md's guardrail); do not repair, do not enter
          either workflow
          proven authoritative EF history on the configured ref, and local
          project state proven to be based on that history (an ordinary
          established-EF working state, not a never-integrated bootstrap
          candidate) -> continue (normal workflow)
          authoritative EF history proven on the configured ref, but the
          local tree is a stale never-integrated bootstrap candidate, or
          its provenance relative to that history is ambiguous -> fail
          closed; follow the preemption handoff in
          references/existing-project-bootstrap.md Step 7: preserve the
          unintegrated intent separately, materialize a working tree based
          on the actual current `integration_ref` state, then run context
          discovery / CHG planning
          valid completed local EF project + proven EF-free configured
          ref history (or the ref does not resolve) -> resume
          references/existing-project-bootstrap.md at the appropriate
          step; never rerun `ef init`
          ref/history unavailable, or evidence otherwise ambiguous ->
          stop as incomplete; ask the human for the missing evidence
   no  -> is this an established codebase (existing behavior, docs, tests,
          Git history) rather than a fresh/greenfield setup?
          no (greenfield)   -> references/project-init.md (ef init)
          yes, or ambiguous -> references/existing-project-bootstrap.md
                               (ask the human when the evidence is unclear;
                               never equate "no .engineering/" with "init
                               and bootstrap immediately")

2. Load minimal context for the task
   -> references/context-discovery.md

3. What is being authored?
   new draft PRD/REQ/ADR/POL/CHG        -> references/draft-authoring.md
   change to ALREADY-active content      -> references/chg-planning.md
   (draft body edits on an existing draft file are just direct edits - no CLI
   command exists for editing, so open the file and edit it)

4. Validate the working tree
   -> references/validation-and-diagnostics.md
   -> fix any reported diagnostic directly in the file it names, then re-run
      the same validate command until exit 0 (or exit 1 with only accepted
      warnings under default policy)
```

## Reference index

- `references/project-init.md` - `ef init` flags, the dry-run/yes plan
  pattern, and initialization guardrails.
- `references/existing-project-bootstrap.md` - first-time EF adoption for an
  established codebase: bounded repository archaeology, human-confirmed
  initial knowledge inventory, the initial draft/active status boundary, and
  one complete bootstrap state validated with snapshot then bootstrap scope.
- `references/context-discovery.md` - the staged query composition, exact
  `ef query *` / `ef resource read` syntax, and why no step may be skipped.
- `references/draft-authoring.md` - `ef artifact create <type>`, required
  envelope fields, per-type required body headings, relation ontology, and
  Resource attachment.
- `references/chg-planning.md` - when a CHG is required vs. optional, effect
  classification (`introduces`/`modifies`/`retires`), completed/retired CHG
  body requirements, and why there is no CLI command for this step.
- `references/validation-and-diagnostics.md` - `ef validate` scopes and
  flags, the JSON envelope, the four exit codes, and the diagnostic
  read-fix-reverify loop.
