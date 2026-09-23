Feature: Prepare and manage music for offline playback
  @spec:id:01a0aa2f-328e-7030-aaea-fcdc72113cb9
  @spec:demonstrates:01a0aa2f-3a4c-76cf-b151-f585530e9206
  Scenario: Invalidate offline music after its source representation changes
    Given Saved offline media matches an older representation of the same catalog music identity.
    When The current catalog declares a different source representation.
    Then The older saved content is not treated as ready for current offline playback.
