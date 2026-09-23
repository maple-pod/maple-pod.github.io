Feature: Prepare a world-map snapshot for offline exploration
  @spec:id:01a0aa2f-3e18-71ea-8ac8-bfa7ab56ef9c
  @spec:demonstrates:01a0aa2f-45b9-77d2-83c4-ce42f3a38099
  Scenario: Invalidate offline-map readiness on snapshot revision change
    Given Saved offline-map data corresponds to an earlier or different snapshot revision.
    When The selected snapshot or its runtime manifest identity changes.
    Then The older data does not satisfy readiness for the current exact snapshot revision.
