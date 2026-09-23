Feature: Generate and publish a selectable world-map snapshot
  @spec:id:01a0aa30-9f39-7a30-948c-abf96500cf0e
  @spec:demonstrates:01a0aa30-a6f5-7fdc-ae1b-4adf2b92a6ad
  Scenario: Do not fabricate missing world-map topology or assets
    Given The canonical snapshot graph has an unresolved parent or link or a required resource fails integrity checks.
    When The publication verifier processes the snapshot.
    Then Missing targets remain unresolved and missing or invalid required resources prevent selectable publication instead of being silently repaired into a different map.
