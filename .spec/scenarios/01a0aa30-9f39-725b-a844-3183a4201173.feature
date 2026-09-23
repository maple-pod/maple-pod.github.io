Feature: Generate and publish a selectable world-map snapshot
  @spec:id:01a0aa30-9f39-7533-b039-6845151d989c
  @spec:demonstrates:01a0aa30-a6f5-7fdc-ae1b-4adf2b92a6ad
  Scenario: Generate and publish a selectable world-map snapshot
    Given The maintainer has inputs for one requested world-map snapshot and the related music catalog.
    When The maintainer requests a preview or production publication for the exact snapshot identity.
    When The publication process assembles the snapshot and validates it as a complete, consumable artifact.
    When A fully verified production snapshot is made selectable in the catalog.
    When Published snapshots are revalidated as part of later resource maintenance.
    Then Users can select only a fully verified production snapshot for the requested identity; failed publication or revalidation does not silently expose a different or stale snapshot.
