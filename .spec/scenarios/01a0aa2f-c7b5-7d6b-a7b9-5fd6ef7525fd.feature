Feature: Select and navigate a world-map snapshot
  @spec:id:01a0aa2f-c7b5-7941-baa4-987f56cd0744
  @spec:demonstrates:01a0aa2f-cf61-7f74-9961-9ace10bb7f6c
  Scenario: Select and navigate a world-map snapshot
    Given The world-map catalog can be loaded and at least one selectable snapshot is available.
    When The user opens World Map or requests a snapshot.
    When Maple Pod resolves a snapshot according to the World Map selection contract and loads its manifest before committing a switch.
    When The user navigates roots, breadcrumbs, links, and places within the selected map.
    When Maple Pod presents place names for the user's locale and exposes associated music through the normal Playback experience.
    When The user may retry a failed snapshot or node load.
    Then World Map presents one committed snapshot at a time, preserves a usable context through recoverable failures, exposes navigable places and localized labels, and does not invent missing topology.
