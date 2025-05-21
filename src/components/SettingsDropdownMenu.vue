<script setup lang="ts">
import {
	DropdownMenuItem,
} from 'reka-ui'

const appStore = useAppStore()
const { toggleDark } = appStore

const {
	exportSavedUserData,
	importSavedUserData,
	resetSavedUserData,
} = useSavedUserData()

const { confirm } = useUiConfirmDialog()

const importSavedDataFileDialog = useFileDialog({
	accept: '.json',
	multiple: false,
	directory: false,
	reset: true,
})
importSavedDataFileDialog.onChange(async (files) => {
	if (files == null || files.length === 0)
		return

	const file = files[0]!

	const agreed = await confirm({
		title: 'Import Saved Data',
		description: 'Are you sure you want to import saved data from this file? This will overwrite your current saved data.',
	})

	if (!agreed)
		return

	importSavedUserData(file)
})

function handleImportSavedData() {
	importSavedDataFileDialog.open()
}

async function handleResetSavedData() {
	const agreed = await confirm({
		title: 'Reset Saved Data',
		description: 'Are you sure you want to reset saved data?',
	})

	if (!agreed)
		return

	resetSavedUserData()
}
</script>

<template>
	<UiDropdownMenu>
		<template #trigger>
			<button
				:class="pika('icon-btn', {
					'--size': '36px',
				})"
				@click.stop
			>
				<div
					:class="pika('i-f7:gear-alt')"
				/>
			</button>
		</template>

		<DropdownMenuItem
			:class="pika('hover-mask', {
				'display': 'flex',
				'alignItems': 'center',
				'gap': '8px',
				'padding': '8px',
				'cursor': 'pointer',
				'$::before': {
					borderRadius: '4px',
				},
			})"
			@select.prevent="toggleDark()"
		>
			<div
				:class="pika({
					'fontSize': '20px',
					'$': ['i-f7:sun-max'],
					'@dark': ['i-f7:moon'],
				})"
			/>
			<span :class="pika({ fontSize: '14px' })">Theme</span>
		</DropdownMenuItem>

		<DropdownMenuItem
			:class="pika('hover-mask', {
				'display': 'flex',
				'alignItems': 'center',
				'gap': '8px',
				'padding': '8px',
				'cursor': 'pointer',
				'$::before': {
					borderRadius: '4px',
				},
			})"
			@select="exportSavedUserData()"
		>
			<div
				:class="pika('i-f7:arrow-down-doc', { fontSize: '20px' })"
			/>
			<span :class="pika({ fontSize: '14px' })">Export Saved Data</span>
		</DropdownMenuItem>

		<DropdownMenuItem
			:class="pika('hover-mask', {
				'display': 'flex',
				'alignItems': 'center',
				'gap': '8px',
				'padding': '8px',
				'cursor': 'pointer',
				'$::before': {
					borderRadius: '4px',
				},
			})"
			@select="handleImportSavedData()"
		>
			<div
				:class="pika('i-f7:arrow-up-doc', { fontSize: '20px' })"
			/>
			<span :class="pika({ fontSize: '14px' })">Import Saved Data</span>
		</DropdownMenuItem>

		<DropdownMenuItem
			:class="pika('hover-mask', {
				'display': 'flex',
				'alignItems': 'center',
				'gap': '8px',
				'padding': '8px',
				'cursor': 'pointer',
				'$::before': {
					borderRadius: '4px',
				},
			})"
			@select="handleResetSavedData()"
		>
			<div
				:class="pika('i-f7:arrow-counterclockwise', { fontSize: '20px' })"
			/>
			<span :class="pika({ fontSize: '14px' })">Reset</span>
		</DropdownMenuItem>
	</UiDropdownMenu>
</template>
