Feature: Export, import, transfer, and reset saved user data
  @spec:id:01a0aa2f-ad23-7bcb-884e-59b3c986673f
  @spec:demonstrates:01a0aa2f-b4b5-70e7-8603-5038cf608544
  Scenario: Reject invalid portable data without mutation
    Given Saved user data exists and an incoming file or setup link is malformed or has invalid known fields.
    When The user attempts to import the invalid payload.
    Then Import fails closed and all existing saved and device-local state remains unchanged.
