Feature: Manage liked and custom playlists
  @spec:id:01a0a9ae-ee7a-7dad-8681-21fb1fb50bcb
  @spec:demonstrates:01a0a9ae-f612-785a-a8f3-1aa475eb8c2f
  Scenario: Reject an empty custom-playlist title
    Given The user is editing a custom playlist title.
    When The user submits a title containing only whitespace.
    Then The trimmed empty title is rejected, the collection is unchanged, and the user may correct the title.
