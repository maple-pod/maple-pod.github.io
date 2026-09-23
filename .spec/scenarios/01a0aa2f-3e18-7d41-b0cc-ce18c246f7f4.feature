Feature: Prepare a world-map snapshot for offline exploration
  @spec:id:01a0aa2f-3e18-771b-9762-2efdc0ef186a
  @spec:demonstrates:01a0aa2f-45b9-77d2-83c4-ce42f3a38099
  Scenario: Retry failed offline-map preparation directly
    Given An offline-map preparation has failed.
    When The user requests Retry without a prior Remove operation.
    Then The retry can start and failed or partial data is not reported ready.
