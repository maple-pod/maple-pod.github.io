Feature: Open shared music and playlist links
  @spec:id:01a0a9ae-fbe8-768b-a3f6-61e0ca1bba3c
  @spec:demonstrates:01a0a9af-03b7-764c-9802-96ae378c85d3
  Scenario: Reject an unknown shared music target
    Given A shared music link contains an ID absent from the receiver catalog.
    When The receiver opens the link.
    Then The receiver is told the track is unavailable, playback confirmation does not open, and no playback begins.
