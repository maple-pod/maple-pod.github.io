Feature: Start and control a playback session
  @spec:id:01a0a9ae-e114-79c6-b91c-08f610945e3c
  @spec:demonstrates:01a0a9ae-e8a8-7e9b-9e34-a3159241ee51
  Scenario: Reject an unknown playback selection
    Given Playback is available but the requested playlist or music identity does not resolve.
    When The user requests playback of the unknown selection.
    Then The unknown item does not become current and no invalid playback transition succeeds.
