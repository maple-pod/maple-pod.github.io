// Explicitly reviewed authoring plan: each outer array position maps to the
// 1-based bullet in that archived Use Case's Alternate & Failure Flows section.
// An entry may create multiple Scenarios if its original bullet joins outcomes.
const c = (title, given, when, then) => ({ title, given, when, then })

export const scenarioPlan = {
	'01a0a9ae-e114-792d-a700-51fab5ab118d': [
		[
			c('Reject an empty playback selection', 'Playback is available but the selected playlist has no eligible music.', 'The user requests playback of the empty selection.', 'No current track or successful playback transition is established.'),
			c('Reject an unknown playback selection', 'Playback is available but the requested playlist or music identity does not resolve.', 'The user requests playback of the unknown selection.', 'The unknown item does not become current and no invalid playback transition succeeds.'),
			c('Skip an unavailable navigation candidate', 'An active playlist contains both playable and currently unavailable tracks.', 'The user navigates through the playback queue.', 'Unavailable candidates are skipped and only an eligible playlist member may become current.'),
			c('Reject a currently unplayable requested track', 'A selected playlist contains a known music item that is currently unavailable for playback.', 'The user specifically requests the unavailable music item as the starting track.', 'The unplayable item is not committed as the current track and playback cannot successfully start with that requested item.'),
		],
		[
			c('Do not commit a source-resolution failure', 'A playlist contains a music item whose playback source cannot resolve.', 'The user requests playback of that music item.', 'The failed item does not become the current track and the transition is not reported successful.'),
			c('Do not commit a failed playback start', 'A music item resolves but its playback start fails.', 'The user requests playback of that music item.', 'The failed item does not become the current track and the prior successful state is not replaced by a false success.'),
		],
		[
			c('Restart the current track after the previous-button threshold', 'The current track has played for more than three seconds.', 'The user activates Previous.', 'Playback restarts the current track rather than navigating to an earlier queue member.'),
			c('Navigate backward at the previous-button threshold', 'The current track has played for three seconds or less and the queue has an eligible previous member.', 'The user activates Previous.', 'Playback navigates backward according to the queue contract without exposing its internal selection mechanism.'),
		],
	],
	'01a0a9ae-ee7a-7645-9269-b96cc0558b16': [
		[
			c('Reject an empty custom-playlist title', 'The user is editing a custom playlist title.', 'The user submits a title containing only whitespace.', 'The trimmed empty title is rejected, the collection is unchanged, and the user may correct the title.'),
			c('Reject an overlength custom-playlist title', 'The user is editing a custom playlist title.', 'The user submits a title longer than fifty characters after trimming.', 'The overlength title is rejected without changing the playlist and the user may correct it.'),
		],
		[c('Keep the generated All playlist read-only', 'The generated All catalog playlist is visible alongside saveable playlists.', 'The user tries to edit All as a user-owned collection.', 'All rejects the membership mutation and remains derived from the music catalog.')],
		[c('Preserve a custom playlist when deletion is cancelled', 'A custom playlist exists and the delete confirmation is open.', 'The user cancels the confirmation.', 'The custom playlist and its membership remain unchanged.')],
		[c('Reject an unknown playlist target without mutation', 'The playlist collection is available but a requested playlist identity is unknown.', 'The user tries to open or mutate that playlist.', 'The user returns to the playlist collection without any playlist mutation.')],
		[c('Preserve hidden members when reordering visible playlist entries', 'A saveable playlist contains both visible and unavailable or filtered-out members.', 'The user reorders the visible members without requesting removal.', 'Every member not explicitly removed remains in the saveable playlist and only the accepted order changes.')],
	],
	'01a0a9ae-fbe8-7b66-bc4a-0f7c376d2d23': [
		[
			c('Reject an unknown shared music target', 'A shared music link contains an ID absent from the receiver catalog.', 'The receiver opens the link.', 'The unresolved target is rejected and no playback begins.'),
			c('Reject malformed or schema-invalid shared playlist data', 'A sharing URL has an undecodable, wrong-action or schema-invalid payload.', 'The receiver opens the sharing URL.', 'Validation fails closed without playback, playlist creation or partial import.'),
		],
		[
			c('Declining shared music leaves playback unchanged', 'A valid shared music link has reached receiver confirmation.', 'The receiver declines the shared music action.', 'The requested shared music does not begin playback.'),
			c('Declining a shared playlist prevents import', 'A valid shared playlist link has reached receiver confirmation.', 'The receiver declines the shared playlist action.', 'No playlist import or playlist creation proceeds.'),
		],
		[
			c('Reject a reduced playlist import when the loss is declined', 'A valid shared playlist contains unresolved music IDs and the receiver is shown the missing items.', 'The receiver declines dropping the unresolved members.', 'No partial playlist import or playlist creation proceeds.'),
			c('Preserve remaining order after accepting a reduced playlist', 'A valid shared playlist contains unresolved music IDs and the receiver is shown the missing items.', 'The receiver explicitly accepts the reduced import and confirms the playlist action.', 'Only resolvable members, in their original relative order, populate a prefilled creation flow; a playlist is not created automatically.'),
		],
		[c('Cancelling shared-playlist creation makes no playlist', 'A valid shared playlist has been accepted and its prefilled creation flow is open.', 'The receiver cancels playlist creation.', 'No new playlist is persisted.')],
	],
	'01a0aa2f-1a37-7b13-bfe3-214fd2e456b5': [
		[c('Show no matches without pretending the playlist is empty', 'A nonempty playlist has music but an active mark filter matches no resolvable item.', 'The user applies the filter.', 'The view shows a no-results state distinguishable from an actually empty playlist, and membership is unchanged.')],
		[
			c('Reject locating an unknown playlist', 'The requested target playlist does not resolve.', 'The user asks to locate a music item in that playlist.', 'No target is falsely located and no playlist membership is changed.'),
			c('Reject locating a non-member track', 'The target playlist exists but does not contain the requested track.', 'The user asks to locate the non-member track.', 'No target is falsely located and no playlist membership is changed.'),
		],
		[c('Reveal a located item hidden by an active filter', 'The requested track belongs to the target playlist but its active mark filter hides that track.', 'The user successfully locates that track.', 'The presentation adjusts so the target is visible without mutating playlist membership or ordering.')],
	],
	'01a0aa2f-2565-7b77-8719-0da194ee0636': [
		[c('Do not record a track changed before qualification', 'The current track has been playing continuously for less than three seconds.', 'Playback switches to another track.', 'No recent-history occurrence is recorded for the interrupted track.')],
		[c('Prune permanently stale recent-history references', 'Persisted recent history contains an identity that no longer resolves in the current catalog.', 'History is normalized during saved-data readiness.', 'The permanently stale occurrence is removed from recent history.')],
		[c('Retain a temporarily unavailable recent-history entry', 'A saved recent-history track still resolves but is temporarily unplayable.', 'Recent history is displayed and the user tries to replay the unavailable entry.', 'The entry remains visible as unavailable and replay cannot bypass ordinary playability checks.')],
	],
	'01a0aa2f-328e-748d-a9ab-efe96e54751a': [
		[
			c('A failed offline-music download is not ready', 'An offline download for a music item is in progress.', 'The download fails.', 'Failure is visible and the item is not reported ready for offline playback.'),
			c('An incomplete offline-music download is not ready', 'An offline download has acquired only part of the required music content.', 'The user inspects its offline readiness.', 'The incomplete item is not reported ready for offline playback.'),
		],
		[
			c('Retry cancelled offline-music preparation directly', 'An offline-music preparation has been cancelled.', 'The user requests Retry without removing retained partial content.', 'The retry can start directly and any retained partial content does not grant readiness.'),
			c('Retry failed offline-music preparation directly', 'An offline-music preparation has failed.', 'The user requests Retry without removing the previous failed state.', 'The retry can start directly and the failed state does not grant readiness.'),
		],
		[c('Invalidate offline music after its source representation changes', 'Saved offline media matches an older representation of the same catalog music identity.', 'The current catalog declares a different source representation.', 'The older saved content is not treated as ready for current offline playback.')],
	],
	'01a0aa2f-3e18-7e9d-895e-6d5725de8d13': [
		[
			c('A failed offline-map preparation is not ready', 'Offline preparation is active for a selected world-map snapshot.', 'Acquisition or verification fails.', 'Failure is visible and that snapshot is not reported ready for offline exploration.'),
			c('An incomplete offline-map preparation is not ready', 'Only some required runtime resources for the snapshot have been acquired.', 'The user inspects snapshot offline readiness.', 'The partial snapshot is not reported ready for offline exploration.'),
		],
		[
			c('Retry cancelled offline-map preparation directly', 'An offline-map preparation has been cancelled.', 'The user requests Retry without removing retained valid data.', 'The retry can start and the previous partial data remains not-ready until the full current revision verifies.'),
			c('Retry failed offline-map preparation directly', 'An offline-map preparation has failed.', 'The user requests Retry without a prior Remove operation.', 'The retry can start and failed or partial data is not reported ready.'),
		],
		[c('Invalidate offline-map readiness on snapshot revision change', 'Saved offline-map data corresponds to an earlier or different snapshot revision.', 'The selected snapshot or its runtime manifest identity changes.', 'The older data does not satisfy readiness for the current exact snapshot revision.')],
	],
	'01a0aa2f-ad23-7cdf-be52-1a1914e7ffbf': [
		[c('Reject invalid portable data without mutation', 'Saved user data exists and an incoming file or setup link is malformed or has invalid known fields.', 'The user attempts to import the invalid payload.', 'Import fails closed and all existing saved and device-local state remains unchanged.')],
		[
			c('Cancelling import preserves local saved data', 'Incoming portable user data has passed validation and awaits confirmation.', 'The user cancels import.', 'No incoming values are applied to existing local state.'),
			c('Cancelling a destructive reset preserves all local state', 'The Reset Saved Data or Factory Reset confirmation is displayed.', 'The user cancels reset.', 'No portable or device-local state is cleared.'),
		],
		[
			c('Reset Saved Data retains device-local offline and onboarding state', 'Portable preferences, playlists, selection, history and device-local offline and onboarding state exist.', 'The user confirms Reset Saved Data.', 'Portable saved data and recent history reset while offline music, offline maps and onboarding metadata are preserved.'),
			c('Factory Reset clears Maple Pod-owned device-local state', 'Portable saved data, history, offline content and onboarding state exist.', 'The user confirms Factory Reset.', 'All Maple Pod-owned local state, including offline content and onboarding metadata, is cleared.'),
		],
	],
	'01a0aa2f-ba62-762d-a7c9-ed8698662b0f': [
		[c('Keep an unavailable selected background preference', 'A saved Specific background identity is absent from the current background catalog.', 'The application renders with that missing selected identity.', 'Rendering remains usable with no background while the stored identity remains unchanged for a possible later return.')],
		[c('Keep the application usable without any eligible backgrounds', 'The background catalog is empty or its resources are unavailable.', 'The application starts or updates background presentation.', 'The application remains functional and background presentation degrades safely.')],
	],
	'01a0aa2f-c7b5-7941-baa4-987f56cd0744': [
		[c('Resolve an invalid explicit world-map request without inventing a snapshot', 'An explicit route names an invalid or unselectable snapshot and a catalog default is available.', 'The user opens the invalid world-map route.', 'The selection resolves to the catalog default rather than fabricating or committing the invalid identity.')],
		[
			c('Keep the previous world map when a candidate switch fails', 'A usable world-map snapshot is already committed and another snapshot is selectable.', 'The user requests the candidate but its manifest fails to load.', 'The previous usable snapshot and remembered selection remain committed.'),
			c('Show initial world-map errors without silently switching targets', 'No usable world-map snapshot is yet committed and an initially resolved candidate fails to load.', 'The user enters World Map.', 'The intended candidate remains selected for recovery, an error and retry path are visible, and no fallback is silently committed solely because loading failed.'),
		],
		[c('Keep unresolved world-map topology targets visible', 'The selected snapshot declares a link or parent whose target resource is missing.', 'The user navigates to the unresolved topology target.', 'The missing target is visibly unavailable or unresolved rather than fabricated as valid map content.')],
	],
	'01a0aa30-6cf3-75d8-affa-754ac1518396': [
		[c('Ignore unsupported auxiliary playback surfaces', 'Primary audio playback is functional but a browser auxiliary control surface is unsupported.', 'The user encounters the unsupported auxiliary surface.', 'That surface is omitted or unavailable while ordinary primary playback remains usable.')],
		[
			c('Do not intercept Space while editing', 'Playback is active and focus is inside an interactive or editable field.', 'The user presses Space within the focused field.', 'The playback shortcut does not run and ordinary field interaction is not hijacked.'),
			c('Do not act on repeated or modified Space events', 'Playback is active and the keyboard shortcut listener is available.', 'A repeated or modifier-assisted Space event occurs.', 'The unsuitable event does not toggle playback.'),
		],
		[c('Closing Picture-in-Picture preserves the shared session', 'The supported auxiliary Picture-in-Picture player represents an existing primary playback session.', 'The user closes the auxiliary window.', 'The same current track, queue and transport state remain available through the primary player without a forked or destroyed session.')],
		[c('Do not require unload confirmation solely for paused playback', 'A playback session still has a current track but is paused.', 'The user closes or navigates away from the page.', 'The active-listening unload safeguard is not required solely because the paused session exists.')],
	],
	'01a0aa30-7874-7e57-9a65-bad6b09a6a17': [
		[c('Reject an ineligible loudness analysis report as a whole', 'The available analysis report is missing, incomplete, stale for the resource build or has failures.', 'Playback evaluates the report for automatic normalization.', 'No track receives selective compensation from that ineligible report; ordinary playback remains available.')],
		[
			c('Bypass normalization on an unsupported output path', 'A valid analysis report is present but the playback output cannot safely apply normalization.', 'Playback starts a resolvable track.', 'Normalization is bypassed and ordinary playback continues.'),
			c('Bypass normalization after an output-path failure', 'A valid analysis report is present but the normalization output path fails.', 'Playback tries to apply automatic compensation.', 'Playback continues normally without compensation.'),
		],
		[c('A normalization subsystem failure cannot disable a playable track', 'A music track is playable but its normalization subsystem fails during playback.', 'Playback continues or attempts to start that track.', 'The otherwise playable track remains playable and normalization is bypassed.')],
	],
	'01a0aa30-8602-789a-bb68-f183090d0a74': [
		[c('Use the application normally without PWA browser capabilities', 'The browser does not support the required offline or update APIs.', 'The user opens Maple Pod.', 'The application remains usable as a normal online web application.')],
		[c('Dismissing an update notice preserves the current session', 'A newer application version is available and an update notice is visible.', 'The user dismisses the update notice without selecting Reload.', 'The current page and playback session continue without a forced version switch.')],
		[c('Do not treat an offline shell as downloaded content', 'The generic PWA application shell reports offline readiness but the requested music or map content has not passed its own offline contract.', 'The user checks the music or map content offline readiness.', 'Generic shell readiness does not mark the separate music or map content ready.')],
	],
	'01a0aa30-938a-7f33-a44f-67ea6eee679d': [
		[c('Block publishing inconsistent required resources', 'The requested bundle is missing required audio, metadata or visual assets, or their declared representations disagree.', 'The publication process validates the bundle.', 'The invalid or inconsistent bundle is not published as a valid current-format resource bundle.')],
		[
			c('Publish an otherwise valid resource bundle without optional loudness data', 'The current music and visual resources are valid but no optional loudness report exists.', 'The publication process validates the bundle.', 'The ordinary music and visual bundle may be published without loudness compensation data.'),
			c('Do not use invalid optional loudness data', 'The current music and visual resources are valid but an optional loudness report fails its eligibility contract.', 'The publication process validates and exposes the bundle.', 'The invalid report does not enable playback compensation; ordinary resources remain governed by their own publication contract.'),
		],
		[], // Source bullet is a process-boundary note, not an observable product behavior.
	],
	'01a0aa30-9f39-7533-b039-6845151d989c': [
		[c('Do not make preview or incomplete world maps selectable', 'A requested world-map snapshot is preview-only, partial, schema-incompatible or inconsistent.', 'The publication verifier examines the candidate snapshot.', 'The candidate remains isolated and non-selectable in the production catalog.')],
		[c('Do not fabricate missing world-map topology or assets', 'The canonical snapshot graph has an unresolved parent or link or a required resource fails integrity checks.', 'The publication verifier processes the snapshot.', 'Missing targets remain unresolved and missing or invalid required resources prevent selectable publication instead of being silently repaired into a different map.')],
		[c('Demote a previously selectable world-map snapshot that fails revalidation', 'A world-map snapshot was previously selectable but its required artifacts or provenance now fail verification.', 'The publication process revalidates that snapshot.', 'The snapshot loses production selectability until the complete current contract passes again.')],
	],
	'01a0aa31-f138-7a5f-b508-ab2c576114b9': [
		[
			c('Show About once on a new browser or device', 'Maple Pod opens on a browser or device without a recorded first-visit dismissal.', 'The user starts a normal application visit.', 'The About notice is proactively displayed and may be dismissed locally.'),
			c('Restore first-visit About after onboarding storage is cleared', 'A browser previously recorded its first-visit dismissal but the relevant local onboarding state has been cleared.', 'The user opens Maple Pod again.', 'The About notice is presented as a new first visit.'),
		],
		[
			c('Portable Saved Data cannot suppress first-visit About on a new device', 'A new browser or device has no local onboarding dismissal and receives portable Saved Data from another device.', 'The user imports the portable payload.', 'The imported data does not suppress the new device\'s first-visit About notice.'),
			c('Reset Saved Data preserves local About dismissal', 'A browser has already dismissed first-visit About and retains device-local onboarding state.', 'The user confirms Reset Saved Data.', 'The local dismissal remains recorded and the notice does not reopen solely because of the narrower reset.'),
		],
		[c('Factory Reset restores first-visit About', 'The browser has a locally recorded first-visit About dismissal.', 'The user confirms Factory Reset and visits again.', 'The dismissal is cleared and About is proactively shown on the next first-visit presentation.')],
	],
}

// These archive bullets define an exclusion/scope boundary, not observable
// application behavior. Keep them in the exact crosswalk without fabricating
// a meaningless Scenario solely to inflate coverage. Keys use 1-based bullets.
export const scopeOnlyBullets = {
	'01a0aa30-938a-7f33-a44f-67ea6eee679d:3': 'Acquisition, conversion, retry and deployment are out of scope for this publication interaction; do not invent a product outcome or executable test.',
}
