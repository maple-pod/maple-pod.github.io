Feature: Choose theme and application background
  @spec:id:01a0aa2f-ba62-739a-aaa4-fb6c415b7d5e
  @spec:demonstrates:01a0aa2f-c201-7c0f-b2db-1586e1b519bd
  Scenario: Keep an unavailable selected background preference
    Given A saved Specific background identity is absent from the current background catalog.
    When The application renders with that missing selected identity.
    Then Rendering remains usable with no background while the stored identity remains unchanged for a possible later return.
