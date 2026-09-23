Feature: Filter and locate music in a playlist
  @spec:id:01a0aa2f-1a37-7089-b8c8-617d97ba2b14
  @spec:demonstrates:01a0aa2f-21ad-7b89-83ef-f5c21f463488
  Scenario: Reject locating a non-member track
    Given The target playlist exists but does not contain the requested track.
    When The user asks to locate the non-member track.
    Then No target is falsely located and no playlist membership is changed.
