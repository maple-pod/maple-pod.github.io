Feature: Filter and locate music in a playlist
  @spec:id:01a0aa2f-1a37-7b13-bfe3-214fd2e456b5
  @spec:demonstrates:01a0aa2f-21ad-7b89-83ef-f5c21f463488
  Scenario: Filter and locate music in a playlist
    Given A playlist can be displayed with resolvable music metadata.
    When The user opens a playlist and chooses zero or more available marks.
    When Maple Pod narrows the visible tracks according to the selected marks.
    When The user may locate a known music item in a target playlist.
    When Maple Pod navigates to the target playlist context and reveals the located item without changing the playlist.
    Then Filtering changes only the current presentation. Leaving the playlist or reloading clears the temporary filter, and a successful locate action leaves membership/order unchanged while making the target reachable.
