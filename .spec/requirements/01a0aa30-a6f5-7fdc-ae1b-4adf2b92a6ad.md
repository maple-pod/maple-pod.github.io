---
schema: spec/requirement@1
kind: requirement
id: 01a0aa30-a6f5-7fdc-ae1b-4adf2b92a6ad
title: World-map snapshot completeness and compatibility boundary
status: active
relations:
  - type: refines
    target: 01a0aa30-a317-70d6-85a6-3a6144425507
resources: []
---
## Contract
A versioned world-map catalog entry must not be marked selectable unless its exact snapshot's full canonical graph, runtime manifest/chunks, referenced assets, declared canonical source/provenance identity, and declared fingerprints pass the publication verifier. Preview or partial output must remain isolated and non-selectable.

Selectability is not permanent merely because a snapshot previously passed verification. If a previously selectable snapshot later fails revalidation because required canonical/runtime/assets/provenance/fingerprint compatibility is missing or inconsistent, publication state must demote it to non-selectable.

Published canonical, runtime, and catalog artifacts must declare explicit schema/contract versions. Consumers must accept only versions they support and must fail closed on unsupported versions. The normative contract is the presence and enforcement of versioned compatibility; the current implementation values (canonical v8, runtime v3, catalog v1) are current compatibility state, not permanently frozen product constants. Documentation or historical aliases must not override the shipped supported-version implementation.

Each exact snapshot must declare the source/provenance authority that defines its canonical game-data identity. Canonical graph and runtime publication must agree with that declared source/provenance. Multiple providers may be supported across different snapshots, but data from localization/enrichment sources must not silently replace or rewrite the canonical identity/provenance of a published snapshot. Provenance mismatch is a selectability failure, not informational metadata only.

Known missing parents/link targets must be represented explicitly rather than silently repaired into different topology. Runtime revision/cache identity must be sufficient to prevent stale resource mixing and support cache invalidation across changed snapshot content.

The legacy unversioned World Map compatibility alias, including its historical canonical/runtime schema forms, must not be generated as part of the desired publication path. New publication and frontend consumption must use the explicit versioned snapshot/catalog contract.

Provider acquisition/caching/retry algorithms are non-normative except where source authority determines what provenance may be treated as canonical for a snapshot.

## Rationale
Versioned compatibility lets the data contract evolve without turning today's schema numbers into permanent product behavior. Full verification protects the selector from stale, partial, or internally inconsistent resources. Revalidation demotion prevents a previously good artifact from becoming permanently trusted after its files drift. Snapshot-bound provenance allows multiple legitimate acquisition providers while preserving one explicit canonical authority per published snapshot. Removing the unversioned legacy alias eliminates a second contract surface that can drift from the versioned publication path.

## Verification
Generate preview and full artifacts; verify preview cannot become selectable. Independently corrupt canonical data, runtime manifest/chunks, assets, declared provenance, fingerprints, and compatibility versions and confirm selectability/consumption fails closed. Revalidate a previously selectable snapshot after corruption and confirm it is demoted. Change artifact schema version to an unsupported value and confirm rejection rather than heuristic parsing. Verify a valid supported version remains consumable. Feed enrichment data from another provider/region and verify canonical identity remains bound to the snapshot's declared provenance. Confirm known unresolved parent/link references remain explicit. Confirm the publication flow no longer emits the legacy unversioned compatibility alias.

## Reverse-spec evidence
Observed cross-repo contract. Explicit versioned compatibility, strict full verification, revalidation demotion, snapshot-bound canonical provenance, explicit unresolved topology, fail-closed unsupported versions, non-selectable previews, and removal of legacy alias generation were explicitly accepted during Resources review.
