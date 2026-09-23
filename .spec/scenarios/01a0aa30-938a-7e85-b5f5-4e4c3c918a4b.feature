Feature: Build and publish the music and visual resource bundle
  @spec:id:01a0aa30-938a-77f0-8cd9-c77a8981dad8
  @spec:demonstrates:01a0aa30-9b5b-79fc-9ca2-813025501c93
  Scenario: Block publishing inconsistent required resources
    Given The requested bundle is missing required audio, metadata or visual assets, or their declared representations disagree.
    When The publication process validates the bundle.
    Then The invalid or inconsistent bundle is not published as a valid current-format resource bundle.
