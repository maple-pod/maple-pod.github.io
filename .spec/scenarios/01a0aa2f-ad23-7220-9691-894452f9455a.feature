Feature: Export, import, transfer, and reset saved user data
  @spec:id:01a0aa2f-ad23-700f-8040-d419bf9d84db
  @spec:demonstrates:01a0aa2f-b4b5-70e7-8603-5038cf608544
  Scenario: Cancelling a destructive reset preserves all local state
    Given The Reset Saved Data or Factory Reset confirmation is displayed.
    When The user cancels reset.
    Then No portable or device-local state is cleared.
