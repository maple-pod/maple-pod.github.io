Feature: Use cached application resources and accept an available update
  @spec:id:01a0aa30-8602-789a-bb68-f183090d0a74
  @spec:demonstrates:01a0aa30-8db9-7a7f-9ad4-cebb65bb5dd8
  Scenario: Use cached application resources and accept an available update
    Given The browser can provide the application's supported offline shell and update notifications, or can fall back to ordinary web use.
    When Maple Pod prepares the application shell for supported generic offline reuse.
    When When that capability is ready, Maple Pod shows an offline-ready notice.
    When When a newer application version is available, Maple Pod shows an update-ready notice.
    When The user may dismiss the notice or explicitly choose Reload.
    When Maple Pod applies the update and reloads only after the user chooses Reload.
    Then The user can see generic offline readiness and update availability when supported, retain the current session until choosing Reload, and distinguish shell availability from content-specific offline readiness.
