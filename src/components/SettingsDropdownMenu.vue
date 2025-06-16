<script setup lang="ts">
import type { HashActionImportSavedUserData, SavedUserData } from '@/types'
import type { UiDropdownMenuItem } from './UiDropdownMenu.vue'
import AboutDialog from '@/components/AboutDialog.vue'
import { SavedUserDataSchema } from '@/schemas'
import { chunkArray } from '@/utils/common'
import { ofetch } from 'ofetch'
import { safeParse } from 'valibot'

const appStore = useAppStore()
const { toggleDark } = appStore

const {
	savedUserData,
	bgImage,
} = useSavedUserData()

function resetSavedUserData() {
	savedUserData.value = undefined
	window.location.reload()
}

function handleDownloadSavedDataFile() {
	const timeStr = new Date().toISOString()
	exportToJSONFile(savedUserData.value, `maple-pod.${timeStr}.json`)
}

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

	const text = await file.text()
	const data = JSON.parse(text)
	const result = safeParse(SavedUserDataSchema, data)

	if (result.success === false) {
		console.error('Failed to parse saved user data:', result.issues)
		return
	}

	savedUserData.value = result.output as SavedUserData
	window.location.reload()
})

function handleUploadSavedDataFile() {
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

const { copyLink } = useCopyLink()
async function handleCopySavedDataLink() {
	const data: HashActionImportSavedUserData = {
		type: 'import-saved-user-data',
		data: savedUserData.value,
	}

	const hash = dataToUrlHash(data)
	let link = `${window.location.origin}${import.meta.env.BASE_URL}setup/${hash}`

	const recordId = await createRecord(hash)
	if (recordId != null) {
		link = `${window.location.origin}${import.meta.env.BASE_URL}setup/?recordId=${recordId}`
	}

	copyLink({
		link,
	})
}

const { dialog } = useAppDialog()
function handleShowAboutDialog() {
	dialog(AboutDialog, {})
}

const {
	state: bgData,
} = useAsyncState(
	async () => {
		const { list, preview } = await ofetch<{ list: string[], preview: Record<string, string> }>('/resources/bg.json')
		const result = {
			list,
			preview: {} as Record<string, string>,
		}
		await Promise.all(
			list.map(async (bg) => {
				result.preview[bg] = await decodeImageFromBinary(preview[bg]!)
			}),
		)
		return result
	},
	null,
)
const bgChunks = computed(() => {
	if (bgData.value == null)
		return []

	return chunkArray(bgData.value.list, 2)
})

const menuItems = computed<UiDropdownMenuItem[]>(() => [
	{
		icon: pika('i-f7:sun-max', { '@dark': ['i-f7:moon'] }),
		label: 'Theme',
		onSelect: (event) => {
			event.preventDefault()
			toggleDark()
		},
	},
	{
		icon: pika('i-f7:photo-on-rectangle'),
		label: 'Background',
		disabled: bgData.value == null,
		id: 'bg-menu',
	},
	{
		icon: pika('i-f7:archivebox'),
		label: 'Saved Data',
		items: [
			{
				icon: pika('i-f7:arrow-up-doc'),
				label: 'Upload',
				onSelect: handleUploadSavedDataFile,
			},
			{
				icon: pika('i-f7:arrow-down-doc'),
				label: 'Download',
				onSelect: handleDownloadSavedDataFile,
			},
			{
				icon: pika('i-f7:link'),
				label: 'Copy Link',
				onSelect: handleCopySavedDataLink,
			},
			{
				icon: pika('i-f7:arrow-counterclockwise'),
				label: 'Reset',
				onSelect: handleResetSavedData,
			},
		],
	},
	{
		icon: pika('i-f7:info-circle'),
		label: 'About',
		onSelect: handleShowAboutDialog,
	},
])
</script>

<template>
	<UiDropdownMenu
		:items="menuItems"
	>
		<template #trigger>
			<button
				:class="pika('icon-btn')"
				@click.stop
			>
				<div
					:class="pika('i-f7:gear-alt')"
				/>
			</button>
		</template>

		<template
			v-if="bgData != null"
			#bg-menu
		>
			<button
				:class="pika('primary-plain-btn', {
					width: '100%',
					backgroundColor: 'transparent',
					cursor: 'pointer',
					margin: '0 12px 8px 12px',
					padding: '8px 16px',
				})"
				@click="bgImage = 'none'"
			>
				None
			</button>
			<div
				:class="pika({
					height: '400px',
				})"
			>
				<UiVerticalList
					:items="bgChunks"
					:itemHeight="108"
				>
					<template #item="{ item: chunk }">
						<div
							:class="pika({
								display: 'flex',
								gap: '8px',
								marginBottom: '8px',
							})"
						>
							<img
								v-for="bg in chunk"
								:key="bg"
								:src="bgData.preview[bg]"
								:alt="bg"
								:data-is-selected="bgImage === bg"
								role="button"
								:class="pika({
									'display': 'block',
									'height': '100px',
									'cursor': 'pointer',
									'borderRadius': '8px',
									'overflow': 'hidden',
									'opacity': '0.3',

									'$[data-is-selected=true]': {
										opacity: '1',

									},
								})"
								@click="bgImage = bg"
							>
						</div>
					</template>
				</UiVerticalList>
			</div>
		</template>
	</UiDropdownMenu>
</template>
