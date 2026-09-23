Feature: Select and navigate a world-map snapshot
  @spec:id:01a0aa2f-c7b5-7558-b68c-26631cb98220
  @spec:demonstrates:01a0aa2f-cf61-7f74-9961-9ace10bb7f6c
  Scenario: Resolve an invalid explicit world-map request without inventing a snapshot
    Given An explicit route names an invalid or unselectable snapshot and a catalog default is available.
    When The user opens the invalid world-map route.
    Then The selection resolves to the catalog default rather than fabricating or committing the invalid identity.
