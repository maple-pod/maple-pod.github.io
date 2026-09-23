Feature: Filter and locate music in a playlist
  @spec:id:01a0aa2f-1a37-760c-92b6-5097f2196c86
  @spec:demonstrates:01a0aa2f-21ad-7b89-83ef-f5c21f463488
  Scenario: Show no matches without pretending the playlist is empty
    Given A nonempty playlist has music but an active mark filter matches no resolvable item.
    When The user applies the filter.
    Then The view shows a no-results state distinguishable from an actually empty playlist, and membership is unchanged.
