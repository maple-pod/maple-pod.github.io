Feature: Start and control a playback session
  @spec:id:01a0a9ae-e114-792d-a700-51fab5ab118d
  @spec:demonstrates:01a0a9ae-e8a8-7e9b-9e34-a3159241ee51
  Scenario: Start and control a playback session
    Given Application data is ready and the user has a playlist or music item from which playback can be requested.
    When The user starts playback from a playlist or music item.
    When Maple Pod establishes a playback session and begins the requested or next eligible music.
    When The user pauses, resumes, seeks, navigates, changes playback behavior, adjusts volume, or mutes the session.
    When Maple Pod updates the current music and queue as the session progresses.
    Then The player shows the current music, playback state, position, queue/order state, volume, mute state, and available controls. Successful controls affect the same active session.
