Feature: Read the About and usage disclosure
  @spec:id:01a0aa31-f138-7edd-8d2f-96e96e7dba52
  @spec:demonstrates:01a0aa31-f921-7216-95f7-3703d93d7424
  Scenario: Reset Saved Data preserves local About dismissal
    Given A browser has already dismissed first-visit About and retains device-local onboarding state.
    When The user confirms Reset Saved Data.
    Then The local dismissal remains recorded and the notice does not reopen solely because of the narrower reset.
