Feature: Start and control a playback session
  @spec:id:01a0a9ae-e114-7623-b1b6-a807f48ef2a3
  @spec:demonstrates:01a0a9ae-e8a8-7e9b-9e34-a3159241ee51
  Scenario: Reject a currently unplayable requested track
    Given A selected playlist contains a known music item that is currently unavailable for playback.
    When The user specifically requests the unavailable music item as the starting track.
    Then The unplayable item is not committed as the current track and playback cannot successfully start with that requested item.
