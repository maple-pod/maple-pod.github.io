Feature: Prepare and manage music for offline playback
  @spec:id:01a0aa2f-328e-74c7-916a-21b77c810819
  @spec:demonstrates:01a0aa2f-3a4c-76cf-b151-f585530e9206
  Scenario: An incomplete offline-music download is not ready
    Given An offline download has acquired only part of the required music content.
    When The user inspects its offline readiness.
    Then The incomplete item is not reported ready for offline playback.
