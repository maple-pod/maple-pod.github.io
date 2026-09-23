Feature: Control playback from alternate interaction surfaces
  @spec:id:01a0aa30-6cf3-7f72-bb9a-25bb8d0233e5
  @spec:demonstrates:01a0aa30-749b-7d1a-83a5-26df863143cf
  Scenario: Do not act on repeated or modified Space events
    Given Playback is active and the keyboard shortcut listener is available.
    When A repeated or modifier-assisted Space event occurs.
    Then The unsuitable event does not toggle playback.
