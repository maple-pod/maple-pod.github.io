Feature: Control playback from alternate interaction surfaces
  @spec:id:01a0aa30-6cf3-7afd-b8d7-44b4572c49f3
  @spec:demonstrates:01a0aa30-749b-7d1a-83a5-26df863143cf
  Scenario: Do not require unload confirmation solely for paused playback
    Given A playback session still has a current track but is paused.
    When The user closes or navigates away from the page.
    Then The active-listening unload safeguard is not required solely because the paused session exists.
