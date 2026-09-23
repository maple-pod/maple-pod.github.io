Feature: Export, import, transfer, and reset saved user data
  @spec:id:01a0aa2f-ad23-7ab0-a0c9-ff88a625e76a
  @spec:demonstrates:01a0aa2f-b4b5-70e7-8603-5038cf608544
  Scenario: Factory Reset clears Maple Pod-owned device-local state
    Given Portable saved data, history, offline content and onboarding state exist.
    When The user confirms Factory Reset.
    Then All Maple Pod-owned local state, including offline content and onboarding metadata, is cleared.
