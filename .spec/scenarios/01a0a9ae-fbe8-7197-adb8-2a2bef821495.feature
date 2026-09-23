Feature: Open shared music and playlist links
  @spec:id:01a0a9ae-fbe8-72a3-a918-d94ea91f0a28
  @spec:demonstrates:01a0a9af-03b7-764c-9802-96ae378c85d3
  Scenario: Reject malformed or schema-invalid shared playlist data
    Given A sharing URL has an undecodable, wrong-action or schema-invalid payload.
    When The receiver opens the sharing URL.
    Then Validation fails closed without playback, playlist creation or partial import.
