Feature: Read the About and usage disclosure
  @spec:id:01a0aa31-f138-7a5f-b508-ab2c576114b9
  @spec:demonstrates:01a0aa31-f921-7216-95f7-3703d93d7424
  Scenario: Read the About and usage disclosure
    Given The application can present an About/context notice and retain browser/device-local onboarding state.
    When On the first recorded visit, Maple Pod presents the About/context notice.
    When The user reads and dismisses the notice.
    When Maple Pod remembers the dismissal for later normal visits on that browser/device.
    When The user can reopen About from Settings at any time.
    Then The disclosure is presented at the intended first-visit boundary, remains manually accessible, and does not repeatedly interrupt a returning user after dismissal.
