<script setup lang="ts">
import { useRegisterSW } from 'virtual:pwa-register/vue'

const {
	offlineReady,
	needRefresh,
	updateServiceWorker,
} = useRegisterSW({
	immediate: true,
})

async function close() {
	offlineReady.value = false
	needRefresh.value = false
}
</script>

<template>
	<div
		v-if="offlineReady || needRefresh"
		:class="pika('card', {
			position: 'fixed',
			right: '16px',
			bottom: '16px',
			zIndex: '10',
			display: 'flex',
			flexDirection: 'column',
			alignItems: 'center',
		})"
		role="alert"
	>
		<div
			:class="pika({
				marginBottom: '16px',
			})"
		>
			<span v-if="offlineReady">
				App ready to work offline
			</span>
			<span v-else>
				New content available, click on reload button to update.
			</span>
		</div>
		<button
			v-if="needRefresh"
			:class="pika('primary-plain-btn')"
			@click="updateServiceWorker()"
		>
			Reload
		</button>
		<button
			:class="pika('primary-plain-btn')"
			@click="close"
		>
			Close
		</button>
	</div>
</template>
