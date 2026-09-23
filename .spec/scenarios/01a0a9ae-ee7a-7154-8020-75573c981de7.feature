Feature: Manage liked and custom playlists
  @spec:id:01a0a9ae-ee7a-76fa-b3f9-55e58a4cc3ba
  @spec:demonstrates:01a0a9ae-f612-785a-a8f3-1aa475eb8c2f
  Scenario: Keep the generated All playlist read-only
    Given The generated All catalog playlist is visible alongside saveable playlists.
    When The user tries to edit All as a user-owned collection.
    Then All rejects the membership mutation and remains derived from the music catalog.
