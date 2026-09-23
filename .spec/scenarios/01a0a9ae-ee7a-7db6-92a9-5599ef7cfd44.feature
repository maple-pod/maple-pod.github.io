Feature: Manage liked and custom playlists
  @spec:id:01a0a9ae-ee7a-7bc6-899f-1d1ca0fc3bfa
  @spec:demonstrates:01a0a9ae-f612-785a-a8f3-1aa475eb8c2f
  Scenario: Preserve hidden members when reordering visible playlist entries
    Given A saveable playlist contains both visible and unavailable or filtered-out members.
    When The user reorders the visible members without requesting removal.
    Then Every member not explicitly removed remains in the saveable playlist and only the accepted order changes.
