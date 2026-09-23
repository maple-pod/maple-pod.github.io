Feature: Select and navigate a world-map snapshot
  @spec:id:01a0aa2f-c7b5-7cff-9a7b-8beba10b7464
  @spec:demonstrates:01a0aa2f-cf61-7f74-9961-9ace10bb7f6c
  Scenario: Keep unresolved world-map topology targets visible
    Given The selected snapshot declares a link or parent whose target resource is missing.
    When The user navigates to the unresolved topology target.
    Then The missing target is visibly unavailable or unresolved rather than fabricated as valid map content.
