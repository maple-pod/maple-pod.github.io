<script setup lang="ts">
defineEmits<{
	resolve: []
}>()

const gitCommitHash = __GIT_COMMIT_HASH__
</script>

<template>
	<UiDialog
		:defaultOpen="true"
		:contentClass="pika({ width: '500px' })"
		@close="$emit('resolve')"
	>
		<template #trigger>
			<slot name="trigger" />
		</template>

		<template #title>
			<div :class="pika({ display: 'flex', flexDirection: 'column' })">
				About Maple Pod
				<span :class="pika({ fontSize: '14px', opacity: '0.5' })">
					build: {{ gitCommitHash }}
				</span>
			</div>
		</template>

		<template #content>
			<div :class="pika({ display: 'flex', flexDirection: 'column', gap: '16px' })">
				<p :class="pika({ margin: '0' })">
					Maple Pod is a web-based music player for MapleStory BGM.
				</p>
				<p :class="pika({ margin: '0' })">
					<strong>Copyright Notice</strong>
				</p>
				<p :class="pika({ margin: '0' })">
					All music collected on this site is sourced from the internet. And the metainfo is sourced from the <a
						href="https://github.com/maplestory-music/maplebgm-db"
						target="_blank"
						rel="noopener noreferrer"
						:class="pika({
							color: 'var(--color-primary-1)',
							textDecoration: 'underline',
						})"
					>maplebgm-db</a>.
				</p>
				<p :class="pika({ margin: '0' })">
					All music is for personal listening only. Please do not use it for commercial purposes. This site will not profit from the aforementioned data (including but not limited to selling, placing advertisements, etc.).
				</p>
				<p :class="pika({ margin: '0' })">
					If you are the copyright owner and feel that this site's actions are inappropriate, please contact us directly through the public contact information on <a
						href="https://github.com/maple-pod/maple-pod.github.io"
						target="_blank"
						rel="noopener noreferrer"
						:class="pika({
							color: 'var(--color-primary-1)',
							textDecoration: 'underline',
						})"
					>GitHub</a>. We will address the issue promptly. Thank you!
				</p>
				<p :class="pika({ margin: '0' })">
					<strong>Relationship Disclaimer</strong>
				</p>
				<p :class="pika({ margin: '0' })">
					This site is a fan-made website (fan site) and has no direct or indirect affiliation with any game development/operation units (including but not limited to Nexon, Gamania, Asiasoft, Shanda Games, etc.).
				</p>
			</div>
		</template>
	</UiDialog>
</template>
