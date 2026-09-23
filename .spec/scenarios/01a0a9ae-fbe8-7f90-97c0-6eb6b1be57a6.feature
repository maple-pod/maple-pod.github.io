Feature: Open shared music and playlist links
  @spec:id:01a0a9ae-fbe8-712a-b049-156706b33fd8
  @spec:demonstrates:01a0a9af-03b7-764c-9802-96ae378c85d3
  Scenario: Declining a shared playlist prevents import
    Given A valid shared playlist link has reached receiver confirmation.
    When The receiver declines the shared playlist action.
    Then No playlist import or playlist creation proceeds.
