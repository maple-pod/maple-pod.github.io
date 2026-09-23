Feature: Prepare and manage music for offline playback
  @spec:id:01a0aa2f-328e-748d-a9ab-efe96e54751a
  @spec:demonstrates:01a0aa2f-3a4c-76cf-b151-f585530e9206
  Scenario: Prepare and manage music for offline playback
    Given Music metadata is available and offline controls can be shown for a music item or saveable playlist.
    When The user requests offline availability for an individual music item or the current members of a saveable playlist.
    When Maple Pod shows progress while preparation is active.
    When The user may cancel, retry a failed or incomplete request, or remove saved offline content.
    When Maple Pod reports the item ready only when the Offline Music contract is satisfied.
    Then The user can distinguish active, cancelled, failed/incomplete, ready, and removed outcomes for offline music. Bulk preparation follows the playlist membership captured by the request while readiness remains an item-level outcome.
