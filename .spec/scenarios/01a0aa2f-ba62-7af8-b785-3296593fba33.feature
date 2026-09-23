Feature: Choose theme and application background
  @spec:id:01a0aa2f-ba62-762d-a7c9-ed8698662b0f
  @spec:demonstrates:01a0aa2f-c201-7c0f-b2db-1586e1b519bd
  Scenario: Choose theme and application background
    Given Appearance settings are available and the application may have a background catalog.
    When The user chooses a theme preference and a background preference.
    When Maple Pod applies the choices and responds to later changes in the relevant system preference.
    When When automatic background presentation is selected, Maple Pod changes among eligible backgrounds over time.
    When The user reloads or returns later and sees the accepted appearance preferences still applied.
    Then Theme and background choices affect the visible application, system-driven appearance changes are reflected, and temporary background unavailability does not destroy the user's saved choice.
