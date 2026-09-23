Feature: Manage liked and custom playlists
  @spec:id:01a0a9ae-ee7a-766e-bdeb-9b9b32489ebd
  @spec:demonstrates:01a0a9ae-f612-785a-a8f3-1aa475eb8c2f
  Scenario: Reject an overlength custom-playlist title
    Given The user is editing a custom playlist title.
    When The user submits a title longer than fifty characters after trimming.
    Then The overlength title is rejected without changing the playlist and the user may correct it.
