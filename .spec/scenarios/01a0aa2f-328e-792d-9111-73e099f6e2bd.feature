Feature: Prepare and manage music for offline playback
  @spec:id:01a0aa2f-328e-79cd-ad00-68036dec3115
  @spec:demonstrates:01a0aa2f-3a4c-76cf-b151-f585530e9206
  Scenario: A failed offline-music download is not ready
    Given An offline download for a music item is in progress.
    When The download fails.
    Then Failure is visible and the item is not reported ready for offline playback.
