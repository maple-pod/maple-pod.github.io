Feature: Open shared music and playlist links
  @spec:id:01a0a9ae-fbe8-7a2f-befc-8d4080a268af
  @spec:demonstrates:01a0a9af-03b7-764c-9802-96ae378c85d3
  Scenario: Declining shared music leaves playback unchanged
    Given A valid shared music link has reached receiver confirmation.
    When The receiver declines the shared music action.
    Then The requested shared music does not begin playback.
