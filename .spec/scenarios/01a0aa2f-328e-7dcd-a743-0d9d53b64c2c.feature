Feature: Prepare and manage music for offline playback
  @spec:id:01a0aa2f-328e-79ed-9dd9-a79102ad088b
  @spec:demonstrates:01a0aa2f-3a4c-76cf-b151-f585530e9206
  Scenario: Retry failed offline-music preparation directly
    Given An offline-music preparation has failed.
    When The user requests Retry without removing the previous failed state.
    Then The retry can start directly and the failed state does not grant readiness.
