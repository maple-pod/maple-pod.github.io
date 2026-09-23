Feature: Open shared music and playlist links
  @spec:id:01a0a9ae-fbe8-7b66-bc4a-0f7c376d2d23
  @spec:demonstrates:01a0a9af-03b7-764c-9802-96ae378c85d3
  Scenario: Open shared music and playlist links
    Given The sender has a music item or saveable playlist to share, and the receiver opens a Maple Pod sharing link while application data is available.
    When The sender creates and copies a Maple Pod sharing link.
    When The receiver opens the link and Maple Pod identifies the requested music or playlist action.
    When Maple Pod validates the shared data and resolves the referenced selection according to the Sharing contract.
    When Maple Pod asks the receiver to confirm the requested action.
    When After confirmation, a music share starts the requested playback, while a playlist share opens a prefilled playlist-creation flow.
    When If some playlist entries cannot be resolved, Maple Pod discloses that loss and asks whether the receiver accepts continuing with the remaining ordered selection.
    When The receiver completes or cancels the playlist-creation flow and returns to the normal application flow.
    Then A confirmed valid music share starts the requested music. A confirmed valid playlist share opens creation with the accepted selection; rejected, cancelled, or invalid input leaves the receiver's existing state unchanged.
