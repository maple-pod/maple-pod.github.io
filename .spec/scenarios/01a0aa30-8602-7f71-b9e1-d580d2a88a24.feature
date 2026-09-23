Feature: Use cached application resources and accept an available update
  @spec:id:01a0aa30-8602-7b0c-acc5-72d7e1a51ee9
  @spec:demonstrates:01a0aa30-8db9-7a7f-9ad4-cebb65bb5dd8
  Scenario: Dismissing an update notice preserves the current session
    Given A newer application version is available and an update notice is visible.
    When The user dismisses the update notice without selecting Reload.
    Then The current page and playback session continue without a forced version switch.
