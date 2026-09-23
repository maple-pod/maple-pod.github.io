Feature: Generate and publish a selectable world-map snapshot
  @spec:id:01a0aa30-9f39-7b71-8994-7b640e2ed6b8
  @spec:demonstrates:01a0aa30-a6f5-7fdc-ae1b-4adf2b92a6ad
  Scenario: Demote a previously selectable world-map snapshot that fails revalidation
    Given A world-map snapshot was previously selectable but its required artifacts or provenance now fail verification.
    When The publication process revalidates that snapshot.
    Then The snapshot loses production selectability until the complete current contract passes again.
