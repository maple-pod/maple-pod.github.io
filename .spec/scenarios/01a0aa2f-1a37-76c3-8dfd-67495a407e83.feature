Feature: Filter and locate music in a playlist
  @spec:id:01a0aa2f-1a37-72ed-8760-022132380f91
  @spec:demonstrates:01a0aa2f-21ad-7b89-83ef-f5c21f463488
  Scenario: Reject locating an unknown playlist
    Given The requested target playlist does not resolve.
    When The user asks to locate a music item in that playlist.
    Then No target is falsely located and no playlist membership is changed.
