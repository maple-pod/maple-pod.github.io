Feature: Control playback from alternate interaction surfaces
  @spec:id:01a0aa30-6cf3-75d8-affa-754ac1518396
  @spec:demonstrates:01a0aa30-749b-7d1a-83a5-26df863143cf
  Scenario: Control playback from alternate interaction surfaces
    Given A playback session exists and the browser or device may provide auxiliary control surfaces.
    When The user toggles playback with the supported keyboard shortcut when focus permits it.
    When The user may control the session from supported system-media controls.
    When The user may open the player in a supported compact auxiliary window and close it later.
    When Maple Pod keeps current music, queue, position, and transport actions consistent across these surfaces.
    When While listening actively, Maple Pod requests the available exit safeguard before page close or navigation.
    Then Each supported surface controls or presents the same playback session, and the user can distinguish active-listening protection from ordinary paused-page exit.
