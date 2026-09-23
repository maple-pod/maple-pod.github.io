Feature: Build and publish the music and visual resource bundle
  @spec:id:01a0aa30-938a-75b1-8cc6-01e4363272b0
  @spec:demonstrates:01a0aa30-9b5b-79fc-9ca2-813025501c93
  Scenario: Do not use invalid optional loudness data
    Given The current music and visual resources are valid but an optional loudness report fails its eligibility contract.
    When The publication process validates and exposes the bundle.
    Then The invalid report does not enable playback compensation; ordinary resources remain governed by their own publication contract.
