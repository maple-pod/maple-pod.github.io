Feature: Start and control a playback session
  @spec:id:01a0a9ae-e114-7dc4-b1f5-57dfa96de91b
  @spec:demonstrates:01a0a9ae-e8a8-7e9b-9e34-a3159241ee51
  Scenario: Do not commit a failed playback start
    Given A music item resolves but its playback start fails.
    When The user requests playback of that music item.
    Then The failed item does not become the current track and the prior successful state is not replaced by a false success.
