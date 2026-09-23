Feature: Prepare a world-map snapshot for offline exploration
  @spec:id:01a0aa2f-3e18-7e9d-895e-6d5725de8d13
  @spec:demonstrates:01a0aa2f-45b9-77d2-83c4-ce42f3a38099
  Scenario: Prepare a world-map snapshot for offline exploration
    Given A selectable world-map snapshot can be opened and its offline controls are available.
    When The user requests offline preparation for the selected snapshot.
    When Maple Pod shows progress while the snapshot is being prepared.
    When The user may cancel, retry a failed or incomplete preparation, or remove saved snapshot data.
    When Maple Pod reports the snapshot ready only when the Offline World Map contract is satisfied.
    Then The user can distinguish preparing, failed/incomplete, ready, and removed states for the selected world-map snapshot and can recover from a failed preparation without first removing it.
