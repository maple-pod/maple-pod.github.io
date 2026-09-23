Feature: Select and navigate a world-map snapshot
  @spec:id:01a0aa2f-c7b5-7f4f-b87b-902cdd54307a
  @spec:demonstrates:01a0aa2f-cf61-7f74-9961-9ace10bb7f6c
  Scenario: Show initial world-map errors without silently switching targets
    Given No usable world-map snapshot is yet committed and an initially resolved candidate fails to load.
    When The user enters World Map.
    Then The intended candidate remains selected for recovery, an error and retry path are visible, and no fallback is silently committed solely because loading failed.
