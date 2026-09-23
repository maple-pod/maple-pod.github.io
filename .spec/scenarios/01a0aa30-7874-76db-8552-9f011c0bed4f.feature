Feature: Listen across tracks with automatic loudness compensation
  @spec:id:01a0aa30-7874-745f-bba2-0044701fb1d3
  @spec:demonstrates:01a0aa30-8040-75ec-8449-01fdb60fd306
  Scenario: Reject an ineligible loudness analysis report as a whole
    Given The available analysis report is missing, incomplete, stale for the resource build or has failures.
    When Playback evaluates the report for automatic normalization.
    Then No track receives selective compensation from that ineligible report; ordinary playback remains available.
