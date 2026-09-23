Feature: Control playback from alternate interaction surfaces
  @spec:id:01a0aa30-6cf3-7c07-a892-9e213f073faa
  @spec:demonstrates:01a0aa30-749b-7d1a-83a5-26df863143cf
  Scenario: Do not intercept Space while editing
    Given Playback is active and focus is inside an interactive or editable field.
    When The user presses Space within the focused field.
    Then The playback shortcut does not run and ordinary field interaction is not hijacked.
