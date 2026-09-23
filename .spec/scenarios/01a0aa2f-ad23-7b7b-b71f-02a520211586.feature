Feature: Export, import, transfer, and reset saved user data
  @spec:id:01a0aa2f-ad23-7cdf-be52-1a1914e7ffbf
  @spec:demonstrates:01a0aa2f-b4b5-70e7-8603-5038cf608544
  Scenario: Export, import, transfer, and reset saved user data
    Given Maple Pod contains personal saved data and may also contain device-local history, offline content, or onboarding state.
    When The user exports portable saved data as a file or setup link.
    When The user selects an incoming file or link; Maple Pod validates it and shows the import action for confirmation.
    When After confirmation, Maple Pod merges the accepted portable data according to the Saved Data contract.
    When The user may choose Reset Saved Data or Factory Reset, reviews the stated scope, and confirms the destructive action.
    When Maple Pod applies the selected reset scope and returns to normal use.
    Then The user can transfer personal configuration without unintentionally transferring device-local content, merge accepted data predictably, and distinguish the narrower reset from the full reset.
