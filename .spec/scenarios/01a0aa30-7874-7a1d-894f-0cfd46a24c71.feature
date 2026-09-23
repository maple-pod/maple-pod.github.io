Feature: Listen across tracks with automatic loudness compensation
  @spec:id:01a0aa30-7874-789c-a48a-3205e37281b2
  @spec:demonstrates:01a0aa30-8040-75ec-8449-01fdb60fd306
  Scenario: Bypass normalization on an unsupported output path
    Given A valid analysis report is present but the playback output cannot safely apply normalization.
    When Playback starts a resolvable track.
    Then Normalization is bypassed and ordinary playback continues.
