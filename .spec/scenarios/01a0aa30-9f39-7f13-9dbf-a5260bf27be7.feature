Feature: Generate and publish a selectable world-map snapshot
  @spec:id:01a0aa30-9f39-7805-9944-125866c7ca09
  @spec:demonstrates:01a0aa30-a6f5-7fdc-ae1b-4adf2b92a6ad
  Scenario: Do not make preview or incomplete world maps selectable
    Given A requested world-map snapshot is preview-only, partial, schema-incompatible or inconsistent.
    When The publication verifier examines the candidate snapshot.
    Then The candidate remains isolated and non-selectable in the production catalog.
