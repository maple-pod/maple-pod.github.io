Feature: Return to recently heard music
  @spec:id:01a0aa2f-2565-79a5-bc3c-bbc2d316bf5e
  @spec:demonstrates:01a0aa2f-2ce9-7837-ae1b-114a2180a72a
  Scenario: Prune permanently stale recent-history references
    Given Persisted recent history contains an identity that no longer resolves in the current catalog.
    When History is normalized during saved-data readiness.
    Then The permanently stale occurrence is removed from recent history.
