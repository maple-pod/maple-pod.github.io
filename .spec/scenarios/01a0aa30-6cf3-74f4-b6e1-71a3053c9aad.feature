Feature: Control playback from alternate interaction surfaces
  @spec:id:01a0aa30-6cf3-78ff-95ae-c72313820ea6
  @spec:demonstrates:01a0aa30-749b-7d1a-83a5-26df863143cf
  Scenario: Closing Picture-in-Picture preserves the shared session
    Given The supported auxiliary Picture-in-Picture player represents an existing primary playback session.
    When The user closes the auxiliary window.
    Then The same current track, queue and transport state remain available through the primary player without a forked or destroyed session.
