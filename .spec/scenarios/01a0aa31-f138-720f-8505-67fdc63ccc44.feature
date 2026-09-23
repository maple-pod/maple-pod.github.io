Feature: Read the About and usage disclosure
  @spec:id:01a0aa31-f138-7ed2-af84-1c94c5624cc8
  @spec:demonstrates:01a0aa31-f921-7216-95f7-3703d93d7424
  Scenario: Factory Reset restores first-visit About
    Given The browser has a locally recorded first-visit About dismissal.
    When The user confirms Factory Reset and visits again.
    Then The dismissal is cleared and About is proactively shown on the next first-visit presentation.
