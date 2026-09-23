Feature: Export, import, transfer, and reset saved user data
  @spec:id:01a0aa2f-ad23-7aff-9695-94d949cb474e
  @spec:demonstrates:01a0aa2f-b4b5-70e7-8603-5038cf608544
  Scenario: Reset Saved Data retains device-local offline and onboarding state
    Given Portable preferences, playlists, selection, history and device-local offline and onboarding state exist.
    When The user confirms Reset Saved Data.
    Then Portable saved data and recent history reset while offline music, offline maps and onboarding metadata are preserved.
