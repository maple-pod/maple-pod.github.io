Feature: Prepare and manage music for offline playback
  @spec:id:01a0aa2f-328e-7f4f-810c-4e3a8969fae4
  @spec:demonstrates:01a0aa2f-3a4c-76cf-b151-f585530e9206
  Scenario: Retry cancelled offline-music preparation directly
    Given An offline-music preparation has been cancelled.
    When The user requests Retry without removing retained partial content.
    Then The retry can start directly and any retained partial content does not grant readiness.
