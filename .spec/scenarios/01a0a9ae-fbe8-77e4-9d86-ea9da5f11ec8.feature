Feature: Open shared music and playlist links
  @spec:id:01a0a9ae-fbe8-7ec3-9092-9a84de424ca3
  @spec:demonstrates:01a0a9af-03b7-764c-9802-96ae378c85d3
  Scenario: Preserve remaining order after accepting a reduced playlist
    Given A valid shared playlist contains unresolved music IDs and the receiver is shown the missing items.
    When The receiver explicitly accepts the reduced import and confirms the playlist action.
    Then Only resolvable members, in their original relative order, populate a prefilled creation flow; a playlist is not created automatically.
