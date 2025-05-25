<script setup lang="ts">
import type { HashActionImportSavedUserData, SavedUserData } from '@/types'
import AboutDialog from '@/components/AboutDialog.vue'
import { SavedUserDataSchema } from '@/schemas'
import {
	DropdownMenuItem,
	DropdownMenuPortal,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
} from 'reka-ui'
import { safeParse } from 'valibot'

const appStore = useAppStore()
const { toggleDark } = appStore

const {
	savedUserData,
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

const { copy } = useClipboard({ legacy: true })
const { toast } = useUiToast()
async function handleCopySavedDataLink() {
	const data: HashActionImportSavedUserData = {
		type: 'import-saved-user-data',
		data: savedUserData.value,
	}
	const link = await makeHashActionLink(data)
	if (link == null) {
		toast({
			title: 'Failed to create link',
			duration: 2000,
		})
		return
	}
	copy(link)
	toast({
		title: 'Link Copied!',
		duration: 2000,
	})
}

const { dialog } = useAppDialog()
function handleShowAboutDialog() {
	dialog(AboutDialog, {})
}
</script>

<template>
	<UiDropdownMenu>
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

		<DropdownMenuSub>
			<DropdownMenuSubTrigger
				:class="pika('hover-mask', {
					'display': 'flex',
					'alignItems': 'center',
					'gap': '8px',
					'padding': '8px',
					'cursor': 'pointer',

					'$::before': {
						borderRadius: '4px',
					},

					'$[id^=reka-menu-sub-trigger][data-state=open]::before': {
						opacity: '0.1',
					},
				})"
			>
				<div
					:class="pika('i-f7:archivebox', { fontSize: '20px' })"
				/>
				<span :class="pika({ fontSize: '14px' })">Saved Data</span>

				<div :class="pika('i-f7:chevron-right', { marginLeft: 'auto' })" />
			</DropdownMenuSubTrigger>
			<DropdownMenuPortal>
				<DropdownMenuSubContent
					:class="pika('theme', 'card', {
						padding: '8px',
						minWidth: '200px',
						borderRadius: '4px',
						zIndex: 2,
					})"
				>
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
						@select="handleUploadSavedDataFile()"
					>
						<div
							:class="pika('i-f7:arrow-up-doc', { fontSize: '20px' })"
						/>
						<span :class="pika({ fontSize: '14px' })">Upload</span>
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
						@select="handleDownloadSavedDataFile()"
					>
						<div
							:class="pika('i-f7:arrow-down-doc', { fontSize: '20px' })"
						/>
						<span :class="pika({ fontSize: '14px' })">Download</span>
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
						@select="handleCopySavedDataLink()"
					>
						<div
							:class="pika('i-f7:link', { fontSize: '20px' })"
						/>
						<span :class="pika({ fontSize: '14px' })">Copy Link</span>
					</DropdownMenuItem>
				</DropdownMenuSubContent>
			</DropdownMenuPortal>
		</DropdownMenuSub>

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
			@select="handleShowAboutDialog()"
		>
			<div
				:class="pika('i-f7:info-circle', { fontSize: '20px' })"
			/>
			<span :class="pika({ fontSize: '14px' })">About</span>
		</DropdownMenuItem>
	</UiDropdownMenu>
</template>
