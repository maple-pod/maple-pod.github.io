Feature: Read the About and usage disclosure
  @spec:id:01a0aa31-f138-7959-8f8c-adc894b1c212
  @spec:demonstrates:01a0aa31-f921-7216-95f7-3703d93d7424
  Scenario: Show About once on a new browser or device
    Given Maple Pod opens on a browser or device without a recorded first-visit dismissal.
    When The user starts a normal application visit.
    Then The About notice is proactively displayed and may be dismissed locally.
