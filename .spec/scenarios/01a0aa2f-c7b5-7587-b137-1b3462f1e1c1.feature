Feature: Select and navigate a world-map snapshot
  @spec:id:01a0aa2f-c7b5-700a-af13-813c430bc73d
  @spec:demonstrates:01a0aa2f-cf61-7f74-9961-9ace10bb7f6c
  Scenario: Keep the previous world map when a candidate switch fails
    Given A usable world-map snapshot is already committed and another snapshot is selectable.
    When The user requests the candidate but its manifest fails to load.
    Then The previous usable snapshot and remembered selection remain committed.
