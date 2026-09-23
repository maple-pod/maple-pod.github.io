Feature: Listen across tracks with automatic loudness compensation
  @spec:id:01a0aa30-7874-77a8-8e49-7f6879364dda
  @spec:demonstrates:01a0aa30-8040-75ec-8449-01fdb60fd306
  Scenario: Bypass normalization after an output-path failure
    Given A valid analysis report is present but the normalization output path fails.
    When Playback tries to apply automatic compensation.
    Then Playback continues normally without compensation.
