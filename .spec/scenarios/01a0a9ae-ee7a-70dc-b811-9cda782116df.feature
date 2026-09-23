Feature: Manage liked and custom playlists
  @spec:id:01a0a9ae-ee7a-7b04-af44-70a80c818450
  @spec:demonstrates:01a0a9ae-f612-785a-a8f3-1aa475eb8c2f
  Scenario: Reject an unknown playlist target without mutation
    Given The playlist collection is available but a requested playlist identity is unknown.
    When The user tries to open or mutate that playlist.
    Then The user returns to the playlist collection without any playlist mutation.
