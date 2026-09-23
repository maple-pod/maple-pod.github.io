Feature: Return to recently heard music
  @spec:id:01a0aa2f-2565-7f8d-a868-ea50ab3edafb
  @spec:demonstrates:01a0aa2f-2ce9-7837-ae1b-114a2180a72a
  Scenario: Retain a temporarily unavailable recent-history entry
    Given A saved recent-history track still resolves but is temporarily unplayable.
    When Recent history is displayed and the user tries to replay the unavailable entry.
    Then The entry remains visible as unavailable and replay cannot bypass ordinary playability checks.
