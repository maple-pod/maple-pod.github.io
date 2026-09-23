Feature: Prepare a world-map snapshot for offline exploration
  @spec:id:01a0aa2f-3e18-76b8-856b-5ab77587110d
  @spec:demonstrates:01a0aa2f-45b9-77d2-83c4-ce42f3a38099
  Scenario: An incomplete offline-map preparation is not ready
    Given Only some required runtime resources for the snapshot have been acquired.
    When The user inspects snapshot offline readiness.
    Then The partial snapshot is not reported ready for offline exploration.
