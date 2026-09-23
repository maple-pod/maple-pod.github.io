Feature: Export, import, transfer, and reset saved user data
  @spec:id:01a0aa2f-ad23-7ce0-aab6-5375fd99f810
  @spec:demonstrates:01a0aa2f-b4b5-70e7-8603-5038cf608544
  Scenario: Cancelling import preserves local saved data
    Given Incoming portable user data has passed validation and awaits confirmation.
    When The user cancels import.
    Then No incoming values are applied to existing local state.
