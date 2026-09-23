Feature: Return to recently heard music
  @spec:id:01a0aa2f-2565-7b77-8719-0da194ee0636
  @spec:demonstrates:01a0aa2f-2ce9-7837-ae1b-114a2180a72a
  Scenario: Return to recently heard music
    Given Playback can establish current music and the current catalog can resolve saved history entries.
    When The user listens to music long enough for an occurrence to qualify under the Recent History contract.
    When Maple Pod adds the qualified occurrence to the recent-history view.
    When The user browses recent entries and may replay an entry that is currently playable.
    When Maple Pod keeps the history available after reload and preserves repeated listening occurrences as chronology.
    Then Recent History shows qualified entries newest-first, retains repeated occurrences, persists across reloads, and distinguishes unavailable entries from entries removed as stale.
