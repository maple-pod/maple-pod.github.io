# Legacy alternate/failure-flow Scenario crosswalk

This is traceability evidence, not additional normative authority. Original bullets are quoted from the byte-preserved historical archive and the current `.spec/` graph remains authoritative. Behavioral bullets map to observable Scenarios; one non-behavioral process scope/exclusion bullet is explicitly marked without a fabricated test. The numbered source index is one-based.

## Start and control a playback session (01a0a9ae-e114-792d-a700-51fab5ab118d)

### 1. An empty, unknown, or currently unusable selection cannot start playback; navigation follows the Playback contract for other eligible items.

- [Reject an empty playback selection](../../.spec/scenarios/01a0a9ae-e114-714b-8564-b3c64b6a7e40.feature) — Scenario ID: `01a0a9ae-e114-76c1-a470-17417fab3f7f`

- [Reject an unknown playback selection](../../.spec/scenarios/01a0a9ae-e114-7125-9be8-843e10adbdc9.feature) — Scenario ID: `01a0a9ae-e114-79c6-b91c-08f610945e3c`

- [Skip an unavailable navigation candidate](../../.spec/scenarios/01a0a9ae-e114-7b8d-8ff4-eedfac2edc47.feature) — Scenario ID: `01a0a9ae-e114-797f-a64b-daa4d4357a4d`

- [Reject a currently unplayable requested track](../../.spec/scenarios/01a0a9ae-e114-765b-9758-39c08f4ca44b.feature) — Scenario ID: `01a0a9ae-e114-7623-b1b6-a807f48ef2a3`

### 2. A source or playback failure does not establish the failed item as the current music.

- [Do not commit a source-resolution failure](../../.spec/scenarios/01a0a9ae-e114-7d2c-9bbc-331e90537f09.feature) — Scenario ID: `01a0a9ae-e114-7a55-b436-fcc5f5d71bc3`

- [Do not commit a failed playback start](../../.spec/scenarios/01a0a9ae-e114-7748-a8c5-4095f46000c0.feature) — Scenario ID: `01a0a9ae-e114-7dc4-b1f5-57dfa96de91b`

### 3. Boundary and navigation choices follow the Playback contract without exposing its internal selection mechanism.

- [Restart the current track after the previous-button threshold](../../.spec/scenarios/01a0a9ae-e114-7837-b946-80bdbbf58d7e.feature) — Scenario ID: `01a0a9ae-e114-7e39-8915-f27d01341e46`

- [Navigate backward at the previous-button threshold](../../.spec/scenarios/01a0a9ae-e114-75a9-a378-2b7004a84c14.feature) — Scenario ID: `01a0a9ae-e114-7e6c-a5dd-21b3d358e422`

## Manage liked and custom playlists (01a0a9ae-ee7a-7645-9269-b96cc0558b16)

### 1. An invalid playlist title is rejected with an opportunity to correct it.

- [Reject an empty custom-playlist title](../../.spec/scenarios/01a0a9ae-ee7a-76cc-8a6f-398450dc6992.feature) — Scenario ID: `01a0a9ae-ee7a-7dad-8681-21fb1fb50bcb`

- [Reject an overlength custom-playlist title](../../.spec/scenarios/01a0a9ae-ee7a-7443-ae98-dab99b59094e.feature) — Scenario ID: `01a0a9ae-ee7a-766e-bdeb-9b9b32489ebd`

### 2. The generated catalog playlist cannot be edited as a user-owned collection.

- [Keep the generated All playlist read-only](../../.spec/scenarios/01a0a9ae-ee7a-7154-8020-75573c981de7.feature) — Scenario ID: `01a0a9ae-ee7a-76fa-b3f9-55e58a4cc3ba`

### 3. Cancelling deletion leaves the custom playlist unchanged.

- [Preserve a custom playlist when deletion is cancelled](../../.spec/scenarios/01a0a9ae-ee7a-79df-acc7-2f80eccf2f7d.feature) — Scenario ID: `01a0a9ae-ee7a-7fa6-b7de-2094c238fedf`

### 4. An unknown playlist target returns the user to the playlist collection without applying a mutation.

- [Reject an unknown playlist target without mutation](../../.spec/scenarios/01a0a9ae-ee7a-70dc-b811-9cda782116df.feature) — Scenario ID: `01a0a9ae-ee7a-7b04-af44-70a80c818450`

### 5. Unavailable saved members are handled according to the Playlist contract without silently redefining an unrelated reorder as deletion.

- [Preserve hidden members when reordering visible playlist entries](../../.spec/scenarios/01a0a9ae-ee7a-7db6-92a9-5599ef7cfd44.feature) — Scenario ID: `01a0a9ae-ee7a-7bc6-899f-1d1ca0fc3bfa`

## Open shared music and playlist links (01a0a9ae-fbe8-7b66-bc4a-0f7c376d2d23)

### 1. Unknown, malformed, undecodable, or invalid shared data is rejected without a shared-action side effect.

- [Reject an unknown shared music target](../../.spec/scenarios/01a0a9ae-fbe8-7062-af4f-e7ae578c4185.feature) — Scenario ID: `01a0a9ae-fbe8-768b-a3f6-61e0ca1bba3c`

- [Reject malformed or schema-invalid shared playlist data](../../.spec/scenarios/01a0a9ae-fbe8-7197-adb8-2a2bef821495.feature) — Scenario ID: `01a0a9ae-fbe8-72a3-a918-d94ea91f0a28`

### 2. Declining confirmation prevents playback or playlist import.

- [Declining shared music leaves playback unchanged](../../.spec/scenarios/01a0a9ae-fbe8-7621-9ee3-43c733c94840.feature) — Scenario ID: `01a0a9ae-fbe8-7a2f-befc-8d4080a268af`

- [Declining a shared playlist prevents import](../../.spec/scenarios/01a0a9ae-fbe8-7f90-97c0-6eb6b1be57a6.feature) — Scenario ID: `01a0a9ae-fbe8-712a-b049-156706b33fd8`

### 3. A reduced playlist action cannot continue unless the receiver explicitly accepts the disclosed loss.

- [Reject a reduced playlist import when the loss is declined](../../.spec/scenarios/01a0a9ae-fbe8-7215-a61f-6ce114ee93c6.feature) — Scenario ID: `01a0a9ae-fbe8-7b35-82bd-9a31e06d9b36`

- [Preserve remaining order after accepting a reduced playlist](../../.spec/scenarios/01a0a9ae-fbe8-77e4-9d86-ea9da5f11ec8.feature) — Scenario ID: `01a0a9ae-fbe8-7ec3-9092-9a84de424ca3`

### 4. Cancelling playlist creation does not create a playlist.

- [Cancelling shared-playlist creation makes no playlist](../../.spec/scenarios/01a0a9ae-fbe8-75fd-83ef-2ce09ce4e5a9.feature) — Scenario ID: `01a0a9ae-fbe8-789a-a978-b238d2926971`

## Filter and locate music in a playlist (01a0aa2f-1a37-7b13-bfe3-214fd2e456b5)

### 1. A filter with no matches shows a no-results state distinct from an empty playlist.

- [Show no matches without pretending the playlist is empty](../../.spec/scenarios/01a0aa2f-1a37-7d73-b806-4185055faf56.feature) — Scenario ID: `01a0aa2f-1a37-760c-92b6-5097f2196c86`

### 2. An unknown playlist or non-member target cannot be located and causes no membership change.

- [Reject locating an unknown playlist](../../.spec/scenarios/01a0aa2f-1a37-76c3-8dfd-67495a407e83.feature) — Scenario ID: `01a0aa2f-1a37-72ed-8760-022132380f91`

- [Reject locating a non-member track](../../.spec/scenarios/01a0aa2f-1a37-7106-979f-03273e2331fd.feature) — Scenario ID: `01a0aa2f-1a37-7089-b8c8-617d97ba2b14`

### 3. If an active filter would hide a successfully located item, Maple Pod adjusts the presentation so the item is visible.

- [Reveal a located item hidden by an active filter](../../.spec/scenarios/01a0aa2f-1a37-71f2-a824-9a99d125e5a6.feature) — Scenario ID: `01a0aa2f-1a37-7ad9-83c2-12ae7d9e785b`

## Return to recently heard music (01a0aa2f-2565-7b77-8719-0da194ee0636)

### 1. A track change before the qualification condition is met does not create an occurrence.

- [Do not record a track changed before qualification](../../.spec/scenarios/01a0aa2f-2565-77f4-a2a0-7c55e24ca480.feature) — Scenario ID: `01a0aa2f-2565-77c2-a3d1-9929fc605ce7`

### 2. Entries that are permanently stale are removed according to the history contract.

- [Prune permanently stale recent-history references](../../.spec/scenarios/01a0aa2f-2565-7263-93af-30b968e7f5f9.feature) — Scenario ID: `01a0aa2f-2565-79a5-bc3c-bbc2d316bf5e`

### 3. A resolvable but temporarily unplayable entry remains visible as unavailable and cannot bypass normal playability rules.

- [Retain a temporarily unavailable recent-history entry](../../.spec/scenarios/01a0aa2f-2565-795c-afa4-21ece943bdb7.feature) — Scenario ID: `01a0aa2f-2565-7f8d-a868-ea50ab3edafb`

## Prepare and manage music for offline playback (01a0aa2f-328e-748d-a9ab-efe96e54751a)

### 1. Failure or incomplete preparation is visible and is not reported as ready.

- [A failed offline-music download is not ready](../../.spec/scenarios/01a0aa2f-328e-792d-9111-73e099f6e2bd.feature) — Scenario ID: `01a0aa2f-328e-79cd-ad00-68036dec3115`

- [An incomplete offline-music download is not ready](../../.spec/scenarios/01a0aa2f-328e-7b7a-8660-a0cbb83c4c6f.feature) — Scenario ID: `01a0aa2f-328e-74c7-916a-21b77c810819`

### 2. A cancelled or failed request can be retried directly.

- [Retry cancelled offline-music preparation directly](../../.spec/scenarios/01a0aa2f-328e-7cc9-9e2d-a145b96f14c5.feature) — Scenario ID: `01a0aa2f-328e-7f4f-810c-4e3a8969fae4`

- [Retry failed offline-music preparation directly](../../.spec/scenarios/01a0aa2f-328e-7dcd-a743-0d9d53b64c2c.feature) — Scenario ID: `01a0aa2f-328e-79ed-9dd9-a79102ad088b`

### 3. Content that no longer matches the current catalog representation is not treated as ready.

- [Invalidate offline music after its source representation changes](../../.spec/scenarios/01a0aa2f-328e-784c-a21c-87be7ef89e9a.feature) — Scenario ID: `01a0aa2f-328e-7030-aaea-fcdc72113cb9`

## Prepare a world-map snapshot for offline exploration (01a0aa2f-3e18-7e9d-895e-6d5725de8d13)

### 1. Failure or incomplete preparation is visible and is not reported as ready.

- [A failed offline-map preparation is not ready](../../.spec/scenarios/01a0aa2f-3e18-7fb4-bc6b-e92359db9111.feature) — Scenario ID: `01a0aa2f-3e18-7b23-bc84-f992c009f5b5`

- [An incomplete offline-map preparation is not ready](../../.spec/scenarios/01a0aa2f-3e18-751c-9428-468fbf151384.feature) — Scenario ID: `01a0aa2f-3e18-76b8-856b-5ab77587110d`

### 2. A cancelled or failed preparation can be retried directly.

- [Retry cancelled offline-map preparation directly](../../.spec/scenarios/01a0aa2f-3e18-7d13-afc4-2e030b1e980b.feature) — Scenario ID: `01a0aa2f-3e18-766c-9260-1e82e7bbd41f`

- [Retry failed offline-map preparation directly](../../.spec/scenarios/01a0aa2f-3e18-7d41-b0cc-ce18c246f7f4.feature) — Scenario ID: `01a0aa2f-3e18-771b-9762-2efdc0ef186a`

### 3. Data for an older or otherwise different snapshot revision does not satisfy the current readiness state.

- [Invalidate offline-map readiness on snapshot revision change](../../.spec/scenarios/01a0aa2f-3e18-7db9-b729-f6b02f4e620d.feature) — Scenario ID: `01a0aa2f-3e18-71ea-8ac8-bfa7ab56ef9c`

## Export, import, transfer, and reset saved user data (01a0aa2f-ad23-7cdf-be52-1a1914e7ffbf)

### 1. Malformed or invalid incoming data is rejected without changing local state.

- [Reject invalid portable data without mutation](../../.spec/scenarios/01a0aa2f-ad23-75c0-b2ee-65a83433a237.feature) — Scenario ID: `01a0aa2f-ad23-7bcb-884e-59b3c986673f`

### 2. Cancelling import or reset leaves local state unchanged.

- [Cancelling import preserves local saved data](../../.spec/scenarios/01a0aa2f-ad23-773c-8bb1-8b4ed93a431a.feature) — Scenario ID: `01a0aa2f-ad23-7ce0-aab6-5375fd99f810`

- [Cancelling a destructive reset preserves all local state](../../.spec/scenarios/01a0aa2f-ad23-7220-9691-894452f9455a.feature) — Scenario ID: `01a0aa2f-ad23-700f-8040-d419bf9d84db`

### 3. The two reset choices preserve or clear device-local state according to their stated scopes.

- [Reset Saved Data retains device-local offline and onboarding state](../../.spec/scenarios/01a0aa2f-ad23-7c31-b56a-519096e548bc.feature) — Scenario ID: `01a0aa2f-ad23-7aff-9695-94d949cb474e`

- [Factory Reset clears Maple Pod-owned device-local state](../../.spec/scenarios/01a0aa2f-ad23-7621-9aca-dd60c89ec4c5.feature) — Scenario ID: `01a0aa2f-ad23-7ab0-a0c9-ff88a625e76a`

## Choose theme and application background (01a0aa2f-ba62-762d-a7c9-ed8698662b0f)

### 1. A selected background that is unavailable is rendered safely without breaking the rest of the application.

- [Keep an unavailable selected background preference](../../.spec/scenarios/01a0aa2f-ba62-7ac0-af1b-af339775ee67.feature) — Scenario ID: `01a0aa2f-ba62-739a-aaa4-fb6c415b7d5e`

### 2. An empty or unavailable background catalog leaves the application usable.

- [Keep the application usable without any eligible backgrounds](../../.spec/scenarios/01a0aa2f-ba62-7a20-9141-942ff8a53b2d.feature) — Scenario ID: `01a0aa2f-ba62-7204-aa2e-a93dfd9612e2`

## Select and navigate a world-map snapshot (01a0aa2f-c7b5-7941-baa4-987f56cd0744)

### 1. An invalid or unavailable snapshot request is handled by the selection contract and does not fabricate a target.

- [Resolve an invalid explicit world-map request without inventing a snapshot](../../.spec/scenarios/01a0aa2f-c7b5-7419-b75a-10434fc4369b.feature) — Scenario ID: `01a0aa2f-c7b5-7558-b68c-26631cb98220`

### 2. A failed switch retains a previously usable map context; an initial failure exposes an error and retry path.

- [Keep the previous world map when a candidate switch fails](../../.spec/scenarios/01a0aa2f-c7b5-7587-b137-1b3462f1e1c1.feature) — Scenario ID: `01a0aa2f-c7b5-700a-af13-813c430bc73d`

- [Show initial world-map errors without silently switching targets](../../.spec/scenarios/01a0aa2f-c7b5-7659-97db-b0140ce1c643.feature) — Scenario ID: `01a0aa2f-c7b5-7f4f-b87b-902cdd54307a`

### 3. Missing topology targets remain visibly unresolved or unavailable.

- [Keep unresolved world-map topology targets visible](../../.spec/scenarios/01a0aa2f-c7b5-7e8f-b67e-0bc75e0203c5.feature) — Scenario ID: `01a0aa2f-c7b5-7cff-9a7b-8beba10b7464`

## Control playback from alternate interaction surfaces (01a0aa30-6cf3-75d8-affa-754ac1518396)

### 1. Unsupported auxiliary surfaces remain unavailable while primary playback continues.

- [Ignore unsupported auxiliary playback surfaces](../../.spec/scenarios/01a0aa30-6cf3-7491-a6fa-890a4de1bc83.feature) — Scenario ID: `01a0aa30-6cf3-74c0-80fe-709708272482`

### 2. Interactive or editable focus and unsuitable keyboard events do not trigger the shortcut.

- [Do not intercept Space while editing](../../.spec/scenarios/01a0aa30-6cf3-7842-83b0-9b6a00123f86.feature) — Scenario ID: `01a0aa30-6cf3-7c07-a892-9e213f073faa`

- [Do not act on repeated or modified Space events](../../.spec/scenarios/01a0aa30-6cf3-786f-9e1c-62ce50e13e26.feature) — Scenario ID: `01a0aa30-6cf3-7f72-bb9a-25bb8d0233e5`

### 3. Closing an auxiliary window does not fork or destroy the active playback session.

- [Closing Picture-in-Picture preserves the shared session](../../.spec/scenarios/01a0aa30-6cf3-74f4-b6e1-71a3053c9aad.feature) — Scenario ID: `01a0aa30-6cf3-78ff-95ae-c72313820ea6`

### 4. Paused playback does not require the active-listening exit safeguard.

- [Do not require unload confirmation solely for paused playback](../../.spec/scenarios/01a0aa30-6cf3-71b1-9dc7-cba2cb78618b.feature) — Scenario ID: `01a0aa30-6cf3-7afd-b8d7-44b4572c49f3`

## Listen across tracks with automatic loudness compensation (01a0aa30-7874-7e57-9a65-bad6b09a6a17)

### 1. Missing, incomplete, stale, or failed analysis data makes compensation unavailable as a whole.

- [Reject an ineligible loudness analysis report as a whole](../../.spec/scenarios/01a0aa30-7874-76db-8552-9f011c0bed4f.feature) — Scenario ID: `01a0aa30-7874-745f-bba2-0044701fb1d3`

### 2. An unsupported or failed output path bypasses compensation and continues ordinary playback.

- [Bypass normalization on an unsupported output path](../../.spec/scenarios/01a0aa30-7874-7a1d-894f-0cfd46a24c71.feature) — Scenario ID: `01a0aa30-7874-789c-a48a-3205e37281b2`

- [Bypass normalization after an output-path failure](../../.spec/scenarios/01a0aa30-7874-79f7-9f18-3e005cce61d9.feature) — Scenario ID: `01a0aa30-7874-77a8-8e49-7f6879364dda`

### 3. A compensation failure does not make an otherwise playable track unavailable.

- [A normalization subsystem failure cannot disable a playable track](../../.spec/scenarios/01a0aa30-7874-7bcf-9864-352ad2c967be.feature) — Scenario ID: `01a0aa30-7874-73c3-9a5b-6156329b48b1`

## Use cached application resources and accept an available update (01a0aa30-8602-789a-bb68-f183090d0a74)

### 1. If the browser cannot provide the supported offline/update capability, Maple Pod remains usable as a normal web application.

- [Use the application normally without PWA browser capabilities](../../.spec/scenarios/01a0aa30-8602-7cfb-890f-b035a4c60731.feature) — Scenario ID: `01a0aa30-8602-7e83-8299-185331fc9f72`

### 2. Dismissing an update notice leaves the current session running.

- [Dismissing an update notice preserves the current session](../../.spec/scenarios/01a0aa30-8602-7f71-b9e1-d580d2a88a24.feature) — Scenario ID: `01a0aa30-8602-7b0c-acc5-72d7e1a51ee9`

### 3. Generic application-shell readiness does not make Music or World Map content ready for their separate offline experiences.

- [Do not treat an offline shell as downloaded content](../../.spec/scenarios/01a0aa30-8602-7881-acd4-4faed287ef21.feature) — Scenario ID: `01a0aa30-8602-73f1-8058-6bb82762b262`

## Build and publish the music and visual resource bundle (01a0aa30-938a-7f33-a44f-67ea6eee679d)

### 1. Missing, inconsistent, or unusable resource inputs block publication.

- [Block publishing inconsistent required resources](../../.spec/scenarios/01a0aa30-938a-7e85-b5f5-4e4c3c918a4b.feature) — Scenario ID: `01a0aa30-938a-77f0-8cd9-c77a8981dad8`

### 2. Optional loudness data that is absent does not block ordinary resource publication, but invalid data cannot be used for playback compensation.

- [Publish an otherwise valid resource bundle without optional loudness data](../../.spec/scenarios/01a0aa30-938a-7d9b-83df-aa942002a268.feature) — Scenario ID: `01a0aa30-938a-738f-b8fc-5d3375851a49`

- [Do not use invalid optional loudness data](../../.spec/scenarios/01a0aa30-938a-7b60-bc52-e221fc0700a2.feature) — Scenario ID: `01a0aa30-938a-75b1-8cc6-01e4363272b0`

### 3. Acquisition, conversion, retry, and deployment steps are not part of this interaction.

- **Out-of-scope source note (no Scenario):** Acquisition, conversion, retry and deployment are out of scope for this publication interaction; do not invent a product outcome or executable test.

## Generate and publish a selectable world-map snapshot (01a0aa30-9f39-7533-b039-6845151d989c)

### 1. Preview, partial, incompatible, or inconsistent output remains unavailable for production selection.

- [Do not make preview or incomplete world maps selectable](../../.spec/scenarios/01a0aa30-9f39-7f13-9dbf-a5260bf27be7.feature) — Scenario ID: `01a0aa30-9f39-7805-9944-125866c7ca09`

### 2. Missing topology or resource integrity is reported as unresolved or invalid rather than repaired into a different map.

- [Do not fabricate missing world-map topology or assets](../../.spec/scenarios/01a0aa30-9f39-75b0-8f25-c66c84cc184f.feature) — Scenario ID: `01a0aa30-9f39-7a30-948c-abf96500cf0e`

### 3. A snapshot that fails later verification loses selectability.

- [Demote a previously selectable world-map snapshot that fails revalidation](../../.spec/scenarios/01a0aa30-9f39-7585-a369-aa49159d2a06.feature) — Scenario ID: `01a0aa30-9f39-7b71-8994-7b640e2ed6b8`

## Read the About and usage disclosure (01a0aa31-f138-7a5f-b508-ab2c576114b9)

### 1. A new browser/device or a cleared onboarding state receives the first-visit presentation again according to the disclosure contract.

- [Show About once on a new browser or device](../../.spec/scenarios/01a0aa31-f138-761a-95f2-60e3726f1ad7.feature) — Scenario ID: `01a0aa31-f138-7959-8f8c-adc894b1c212`

- [Restore first-visit About after onboarding storage is cleared](../../.spec/scenarios/01a0aa31-f138-7daa-9539-435cc253423b.feature) — Scenario ID: `01a0aa31-f138-71d0-838b-3e58ca0ad608`

### 2. Portable Saved Data and the narrower saved-data reset do not make the notice disappear from a new device or clear its local dismissal unexpectedly.

- [Portable Saved Data cannot suppress first-visit About on a new device](../../.spec/scenarios/01a0aa31-f138-7fba-8ea1-84f108728aee.feature) — Scenario ID: `01a0aa31-f138-7e59-a76d-6f4998f68f2c`

- [Reset Saved Data preserves local About dismissal](../../.spec/scenarios/01a0aa31-f138-787f-90f1-afd2cd77d45c.feature) — Scenario ID: `01a0aa31-f138-7edd-8d2f-96e96e7dba52`

### 3. Factory Reset can restore first-visit presentation.

- [Factory Reset restores first-visit About](../../.spec/scenarios/01a0aa31-f138-720f-8505-67fdc63ccc44.feature) — Scenario ID: `01a0aa31-f138-7ed2-af84-1c94c5624cc8`
