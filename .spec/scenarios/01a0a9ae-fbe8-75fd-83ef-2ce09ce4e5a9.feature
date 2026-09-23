Feature: Open shared music and playlist links
  @spec:id:01a0a9ae-fbe8-789a-a978-b238d2926971
  @spec:demonstrates:01a0a9af-03b7-764c-9802-96ae378c85d3
  Scenario: Cancelling shared-playlist creation makes no playlist
    Given A valid shared playlist has been accepted and its prefilled creation flow is open.
    When The receiver cancels playlist creation.
    Then No new playlist is persisted.
