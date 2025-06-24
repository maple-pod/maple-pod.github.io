<script setup lang="ts">
import {
	DropdownMenuArrow,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuPortal,
	DropdownMenuRoot,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from 'reka-ui'

interface BaseMenuItem {
	icon?: string
	label: string
	disabled?: boolean
}

interface NormalMenuItem extends BaseMenuItem {
	onSelect: (event: Event) => void
}

interface SubMenu extends BaseMenuItem {
	items: (NormalMenuItem | 'separator')[]
}

interface CustomSubMenu extends BaseMenuItem {
	id: string
}

export type UiDropdownMenuItem = NormalMenuItem | SubMenu | CustomSubMenu | 'separator'

defineProps<{
	items?: UiDropdownMenuItem[]
}>()

const open = defineModel<boolean>('open')

const [DefineUiDropdownMenuNormalMenuItem, UiDropdownMenuNormalMenuItem] = createReusableTemplate<{ item: NormalMenuItem }>()
const [DefineUiDropdownMenuSubMenu, UiDropdownMenuSubMenu] = createReusableTemplate<{ item: SubMenu }>()
const [DefineUiDropdownMenuCustomSubMenu, UiDropdownMenuCustomSubMenu] = createReusableTemplate<{ item: CustomSubMenu }>()
const [DefineUiDropdownMenuSeparator, UiDropdownMenuSeparator] = createReusableTemplate()
</script>

<template>
	<DropdownMenuRoot v-model:open="open">
		<DefineUiDropdownMenuSeparator>
			<DropdownMenuSeparator
				:class="pika({
					margin: '12px 0',
					borderBottom: '1px solid var(--color-border)',
				})"
			/>
		</DefineUiDropdownMenuSeparator>

		<DefineUiDropdownMenuNormalMenuItem v-slot="{ item }">
			<DropdownMenuItem
				:class="pika('hover-mask', {
					'display': 'flex',
					'alignItems': 'center',
					'gap': '8px',
					'padding': '12px',
					'cursor': 'pointer',

					'$[data-disabled]': {
						opacity: '0.5',
						cursor: 'not-allowed',
					},
				})"
				:disabled="item.disabled"
				@select="item.onSelect"
			>
				<div
					v-if="item.icon"
					:class="item.icon"
				/>
				<span :class="pika({ fontSize: '14px' })">{{ item.label }}</span>
			</DropdownMenuItem>
		</DefineUiDropdownMenuNormalMenuItem>

		<DefineUiDropdownMenuSubMenu v-slot="{ item }">
			<DropdownMenuSub>
				<DropdownMenuSubTrigger
					:class="pika('hover-mask', {
						'display': 'flex',
						'alignItems': 'center',
						'gap': '8px',
						'padding': '12px',
						'cursor': 'pointer',

						'$[id^=reka-menu-sub-trigger][data-state=open]::before': {
							opacity: '0.1',
						},

						'$[data-disabled]': {
							opacity: '0.5',
							cursor: 'not-allowed',
						},
					})"
					:disabled="item.disabled"
				>
					<div :class="item.icon" />
					<span :class="pika({ fontSize: '14px' })">{{ item.label }}</span>

					<div :class="pika('i-f7:chevron-right', { marginLeft: 'auto' })" />
				</DropdownMenuSubTrigger>
				<DropdownMenuPortal>
					<DropdownMenuSubContent
						:class="pika('card', {
							padding: '8px',
							minWidth: '200px',
							zIndex: 2,
						})"
					>
						<template
							v-for="(subItem, i) in item.items"
							:key="`sub-item-${i}`"
						>
							<UiDropdownMenuSeparator v-if="subItem === 'separator'" />
							<UiDropdownMenuNormalMenuItem
								v-else-if="'onSelect' in subItem"
								:item="subItem"
							/>
						</template>
					</DropdownMenuSubContent>
				</DropdownMenuPortal>
			</DropdownMenuSub>
		</DefineUiDropdownMenuSubMenu>

		<DefineUiDropdownMenuCustomSubMenu v-slot="{ item }">
			<DropdownMenuSub>
				<DropdownMenuSubTrigger
					:class="pika('hover-mask', {
						'display': 'flex',
						'alignItems': 'center',
						'gap': '8px',
						'padding': '12px',
						'cursor': 'pointer',

						'$[id^=reka-menu-sub-trigger][data-state=open]::before': {
							opacity: '0.1',
						},

						'$[data-disabled]': {
							opacity: '0.5',
							cursor: 'not-allowed',
						},
					})"
					:disabled="item.disabled"
				>
					<div :class="item.icon" />
					<span :class="pika({ fontSize: '14px' })">{{ item.label }}</span>

					<div :class="pika('i-f7:chevron-right', { marginLeft: 'auto' })" />
				</DropdownMenuSubTrigger>
				<DropdownMenuPortal>
					<DropdownMenuSubContent
						:class="pika('card', {
							padding: '8px',
							minWidth: '200px',
							zIndex: 2,
						})"
					>
						<slot :name="item.id" />
					</DropdownMenuSubContent>
				</DropdownMenuPortal>
			</DropdownMenuSub>
		</DefineUiDropdownMenuCustomSubMenu>

		<DropdownMenuTrigger
			asChild
		>
			<slot name="trigger" />
		</DropdownMenuTrigger>

		<DropdownMenuPortal>
			<DropdownMenuContent
				:class="pika('card', {
					padding: '8px',
					minWidth: '200px',
					zIndex: 2,
				})"
			>
				<slot name="menu">
					<template
						v-for="(item, i) in items"
						:key="`item-${i}`"
					>
						<UiDropdownMenuSeparator
							v-if="item === 'separator'"
						/>
						<UiDropdownMenuNormalMenuItem
							v-else-if="'onSelect' in item"
							:item="item"
						/>
						<UiDropdownMenuSubMenu
							v-else-if="'items' in item"
							:item="item"
						/>
						<UiDropdownMenuCustomSubMenu
							v-else-if="'id' in item"
							:item="item"
						/>
					</template>
				</slot>

				<DropdownMenuArrow
					:class="pika({
						fill: 'var(--color-border)',
					})"
				/>
			</DropdownMenuContent>
		</DropdownMenuPortal>
	</DropdownMenuRoot>
</template>
