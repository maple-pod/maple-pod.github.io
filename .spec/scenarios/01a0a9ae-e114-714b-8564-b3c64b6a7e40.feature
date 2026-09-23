Feature: Start and control a playback session
  @spec:id:01a0a9ae-e114-76c1-a470-17417fab3f7f
  @spec:demonstrates:01a0a9ae-e8a8-7e9b-9e34-a3159241ee51
  Scenario: Reject an empty playback selection
    Given Playback is available but the selected playlist has no eligible music.
    When The user requests playback of the empty selection.
    Then No current track or successful playback transition is established.
