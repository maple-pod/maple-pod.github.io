Feature: Listen across tracks with automatic loudness compensation
  @spec:id:01a0aa30-7874-7e57-9a65-bad6b09a6a17
  @spec:demonstrates:01a0aa30-8040-75ec-8449-01fdb60fd306
  Scenario: Listen across tracks with automatic loudness compensation
    Given The music catalog is available; compatible loudness data and a capable audio output may or may not be available.
    When Maple Pod evaluates whether the available loudness data and output path satisfy the Playback loudness contract.
    When When they do, Maple Pod applies automatic per-track loudness compensation during playback.
    When The user listens across track changes without needing to configure compensation manually.
    Then Eligible playback has automatic loudness compensation; ineligible or unsupported playback remains usable through the ordinary path without partial or misleading normalization.
