Feature: Start and control a playback session
  @spec:id:01a0a9ae-e114-7a55-b436-fcc5f5d71bc3
  @spec:demonstrates:01a0a9ae-e8a8-7e9b-9e34-a3159241ee51
  Scenario: Do not commit a source-resolution failure
    Given A playlist contains a music item whose playback source cannot resolve.
    When The user requests playback of that music item.
    Then The failed item does not become the current track and the transition is not reported successful.
