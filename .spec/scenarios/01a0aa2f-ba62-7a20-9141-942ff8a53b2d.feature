Feature: Choose theme and application background
  @spec:id:01a0aa2f-ba62-7204-aa2e-a93dfd9612e2
  @spec:demonstrates:01a0aa2f-c201-7c0f-b2db-1586e1b519bd
  Scenario: Keep the application usable without any eligible backgrounds
    Given The background catalog is empty or its resources are unavailable.
    When The application starts or updates background presentation.
    Then The application remains functional and background presentation degrades safely.
