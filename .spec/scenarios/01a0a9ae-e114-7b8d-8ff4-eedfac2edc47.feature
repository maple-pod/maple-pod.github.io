Feature: Start and control a playback session
  @spec:id:01a0a9ae-e114-797f-a64b-daa4d4357a4d
  @spec:demonstrates:01a0a9ae-e8a8-7e9b-9e34-a3159241ee51
  Scenario: Skip an unavailable navigation candidate
    Given An active playlist contains both playable and currently unavailable tracks.
    When The user navigates through the playback queue.
    Then Unavailable candidates are skipped and only an eligible playlist member may become current.
