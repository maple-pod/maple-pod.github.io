Feature: Read the About and usage disclosure
  @spec:id:01a0aa31-f138-71d0-838b-3e58ca0ad608
  @spec:demonstrates:01a0aa31-f921-7216-95f7-3703d93d7424
  Scenario: Restore first-visit About after onboarding storage is cleared
    Given A browser previously recorded its first-visit dismissal but the relevant local onboarding state has been cleared.
    When The user opens Maple Pod again.
    Then The About notice is presented as a new first visit.
