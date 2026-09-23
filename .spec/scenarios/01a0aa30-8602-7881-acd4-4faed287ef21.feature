Feature: Use cached application resources and accept an available update
  @spec:id:01a0aa30-8602-73f1-8058-6bb82762b262
  @spec:demonstrates:01a0aa30-8db9-7a7f-9ad4-cebb65bb5dd8
  Scenario: Do not treat an offline shell as downloaded content
    Given The generic PWA application shell reports offline readiness but the requested music or map content has not passed its own offline contract.
    When The user checks the music or map content offline readiness.
    Then Generic shell readiness does not mark the separate music or map content ready.
