Feature: Start and control a playback session
  @spec:id:01a0a9ae-e114-7e39-8915-f27d01341e46
  @spec:demonstrates:01a0a9ae-e8a8-7e9b-9e34-a3159241ee51
  Scenario: Restart the current track after the previous-button threshold
    Given The current track has played for more than three seconds.
    When The user activates Previous.
    Then Playback restarts the current track rather than navigating to an earlier queue member.
