Feature: Read the About and usage disclosure
  @spec:id:01a0aa31-f138-7e59-a76d-6f4998f68f2c
  @spec:demonstrates:01a0aa31-f921-7216-95f7-3703d93d7424
  Scenario: Portable Saved Data cannot suppress first-visit About on a new device
    Given A new browser or device has no local onboarding dismissal and receives portable Saved Data from another device.
    When The user imports the portable payload.
    Then The imported data does not suppress the new device's first-visit About notice.
