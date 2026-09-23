Feature: Open shared music and playlist links
  @spec:id:01a0a9ae-fbe8-7b35-82bd-9a31e06d9b36
  @spec:demonstrates:01a0a9af-03b7-764c-9802-96ae378c85d3
  Scenario: Reject a reduced playlist import when the loss is declined
    Given A valid shared playlist contains unresolved music IDs and the receiver is shown the missing items.
    When The receiver declines dropping the unresolved members.
    Then No partial playlist import or playlist creation proceeds.
