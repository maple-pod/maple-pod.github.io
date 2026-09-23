Feature: Return to recently heard music
  @spec:id:01a0aa2f-2565-77c2-a3d1-9929fc605ce7
  @spec:demonstrates:01a0aa2f-2ce9-7837-ae1b-114a2180a72a
  Scenario: Do not record a track changed before qualification
    Given The current track has been playing continuously for less than three seconds.
    When Playback switches to another track.
    Then No recent-history occurrence is recorded for the interrupted track.
