Feature: Manage liked and custom playlists
  @spec:id:01a0a9ae-ee7a-7fa6-b7de-2094c238fedf
  @spec:demonstrates:01a0a9ae-f612-785a-a8f3-1aa475eb8c2f
  Scenario: Preserve a custom playlist when deletion is cancelled
    Given A custom playlist exists and the delete confirmation is open.
    When The user cancels the confirmation.
    Then The custom playlist and its membership remain unchanged.
