Feature: Build and publish the music and visual resource bundle
  @spec:id:01a0aa30-938a-738f-b8fc-5d3375851a49
  @spec:demonstrates:01a0aa30-9b5b-79fc-9ca2-813025501c93
  Scenario: Publish an otherwise valid resource bundle without optional loudness data
    Given The current music and visual resources are valid but no optional loudness report exists.
    When The publication process validates the bundle.
    Then The ordinary music and visual bundle may be published without loudness compensation data.
