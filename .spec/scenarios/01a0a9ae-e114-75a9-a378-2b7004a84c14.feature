Feature: Start and control a playback session
  @spec:id:01a0a9ae-e114-7e6c-a5dd-21b3d358e422
  @spec:demonstrates:01a0a9ae-e8a8-7e9b-9e34-a3159241ee51
  Scenario: Navigate backward at the previous-button threshold
    Given The current track has played for three seconds or less and the queue has an eligible previous member.
    When The user activates Previous.
    Then Playback navigates backward according to the queue contract without exposing its internal selection mechanism.
