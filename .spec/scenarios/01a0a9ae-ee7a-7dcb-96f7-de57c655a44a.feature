Feature: Manage liked and custom playlists
  @spec:id:01a0a9ae-ee7a-7645-9269-b96cc0558b16
  @spec:demonstrates:01a0a9ae-f612-785a-a8f3-1aa475eb8c2f
  Scenario: Manage liked and custom playlists
    Given Music metadata and the user's saved playlist data are available.
    When The user opens the playlist collection and views the built-in and personal playlist concepts.
    When The user creates a custom playlist or edits an existing one.
    When The user adds or removes music in a saveable playlist, changes custom-playlist order, or requests deletion.
    When Maple Pod asks for confirmation before applying custom-playlist deletion.
    When The user returns to the collection or reloads the application and sees the accepted changes.
    Then The playlist collection reflects accepted membership, ordering, title, and deletion changes, and saveable playlist changes remain available after reload.
