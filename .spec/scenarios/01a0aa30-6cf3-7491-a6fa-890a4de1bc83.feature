Feature: Control playback from alternate interaction surfaces
  @spec:id:01a0aa30-6cf3-74c0-80fe-709708272482
  @spec:demonstrates:01a0aa30-749b-7d1a-83a5-26df863143cf
  Scenario: Ignore unsupported auxiliary playback surfaces
    Given Primary audio playback is functional but a browser auxiliary control surface is unsupported.
    When The user encounters the unsupported auxiliary surface.
    Then That surface is omitted or unavailable while ordinary primary playback remains usable.
