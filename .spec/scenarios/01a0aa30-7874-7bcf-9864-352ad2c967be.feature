Feature: Listen across tracks with automatic loudness compensation
  @spec:id:01a0aa30-7874-73c3-9a5b-6156329b48b1
  @spec:demonstrates:01a0aa30-8040-75ec-8449-01fdb60fd306
  Scenario: A normalization subsystem failure cannot disable a playable track
    Given A music track is playable but its normalization subsystem fails during playback.
    When Playback continues or attempts to start that track.
    Then The otherwise playable track remains playable and normalization is bypassed.
