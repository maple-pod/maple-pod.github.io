Feature: Prepare a world-map snapshot for offline exploration
  @spec:id:01a0aa2f-3e18-766c-9260-1e82e7bbd41f
  @spec:demonstrates:01a0aa2f-45b9-77d2-83c4-ce42f3a38099
  Scenario: Retry cancelled offline-map preparation directly
    Given An offline-map preparation has been cancelled.
    When The user requests Retry without removing retained valid data.
    Then The retry can start and the previous partial data remains not-ready until the full current revision verifies.
