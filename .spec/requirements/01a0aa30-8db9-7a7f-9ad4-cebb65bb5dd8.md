---
schema: spec/requirement@1
kind: requirement
id: 01a0aa30-8db9-7a7f-9ad4-cebb65bb5dd8
title: PWA availability and update-notification behavior
status: active
relations:
  - type: refines
    target: 01a0aa30-89dc-7ee7-abe7-443e2e00c4a7
resources: []
---
## Contract
Where service workers are supported, Maple Pod must provide a PWA application shell/runtime cache sufficient for its supported generic offline behavior and must expose a user-visible indication when that app-shell offline capability becomes ready.

When a newer deployed Maple Pod application version is available through the service-worker update lifecycle, Maple Pod must expose a user-visible update-ready state. The application must not silently force a disruptive page reload/version switch merely because new content is ready. The current page/session must continue until the user explicitly chooses Reload. Closing or dismissing the update notification must not itself apply the update through a forced reload.

After explicit Reload, Maple Pod may activate/apply the available worker/update and reload into the newer application version. The exact service-worker registration mode, update plumbing, precache list, runtime cache strategy, cache TTL, cache naming, and Workbox implementation are non-normative.

Generic PWA app-shell/cache readiness is distinct from explicit content-offline readiness. Service-worker cache presence or the generic app-shell offline-ready state must not be used as proof that a music track, playlist, or World Map snapshot satisfies its corresponding explicit offline download/integrity/readiness contract. Those capabilities remain governed by their own normative contracts.

If service workers are unsupported or unavailable, Maple Pod may operate as a normal online web application; lack of PWA support must not by itself make the primary application unusable.

## Rationale
A PWA shell improves resilience and return usage, while explicit Reload keeps disruptive version switches under user control. Keeping generic cache state separate from verified content-offline readiness avoids weakening the stricter guarantees already defined for downloaded music and World Map snapshots.

## Verification
On a service-worker-capable browser, install/register Maple Pod, allow the app shell to become offline-ready, and verify a user-visible readiness notice. Revisit with network unavailable and verify supported cached shell behavior. Deploy/serve a newer application build, verify update readiness is surfaced without automatic page reload, dismiss the notice and confirm the current page remains running, then explicitly choose Reload and verify the new version loads. Separately populate generic runtime caches without completing explicit Music/World Map downloads and verify those capabilities are not reported offline-ready solely from generic cache state. Test a browser/environment without service-worker support and verify ordinary web-app use remains possible.

## Reverse-spec evidence
Observed in `vite.config.ts`, `src/components/PwaReloadPrompt.vue`, and existing explicit offline capability implementations. PWA capability, user-visible app-shell readiness, explicit update Reload consent, and strict offline-readiness separation were explicitly accepted during product review.
