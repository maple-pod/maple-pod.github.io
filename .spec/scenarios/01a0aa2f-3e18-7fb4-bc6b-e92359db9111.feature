Feature: Prepare a world-map snapshot for offline exploration
  @spec:id:01a0aa2f-3e18-7b23-bc84-f992c009f5b5
  @spec:demonstrates:01a0aa2f-45b9-77d2-83c4-ce42f3a38099
  Scenario: A failed offline-map preparation is not ready
    Given Offline preparation is active for a selected world-map snapshot.
    When Acquisition or verification fails.
    Then Failure is visible and that snapshot is not reported ready for offline exploration.
