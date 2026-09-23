Feature: Filter and locate music in a playlist
  @spec:id:01a0aa2f-1a37-7ad9-83c2-12ae7d9e785b
  @spec:demonstrates:01a0aa2f-21ad-7b89-83ef-f5c21f463488
  Scenario: Reveal a located item hidden by an active filter
    Given The requested track belongs to the target playlist but its active mark filter hides that track.
    When The user successfully locates that track.
    Then The presentation adjusts so the target is visible without mutating playlist membership or ordering.
