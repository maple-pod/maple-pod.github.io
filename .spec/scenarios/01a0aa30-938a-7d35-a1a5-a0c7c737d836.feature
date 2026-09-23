Feature: Build and publish the music and visual resource bundle
  @spec:id:01a0aa30-938a-7f33-a44f-67ea6eee679d
  @spec:demonstrates:01a0aa30-9b5b-79fc-9ca2-813025501c93
  Scenario: Build and publish the music and visual resource bundle
    Given The resource-maintenance environment can acquire the configured music, visual, analysis, and background inputs.
    When The maintainer requests a current music and visual resource build.
    When The publication process assembles the catalog and its referenced assets and may produce optional loudness data.
    When The process validates the result as a self-consistent bundle.
    When A valid bundle is published for Maple Pod consumers.
    Then Consumers receive a resource bundle whose declared music, visual, and optional analysis content can be resolved consistently, or a publication failure that leaves the invalid bundle unavailable.
