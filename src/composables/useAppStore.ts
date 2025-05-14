import type { MusicData } from '@/types/MusicData'
import { ofetch } from 'ofetch'

export const useAppStore = defineStore('app', () => {
	const isDark = useDark({
		selector: 'body',
		attribute: 'color-scheme',
		valueDark: 'dark',
		valueLight: 'light',
	})
	const toggleDark = useToggle(isDark)

	const {
		state: data,
		isReady: isDataReady,
	} = useAsyncState(
		async () => new Map<string, MusicData>(
			(await ofetch<any[]>('/data/bgm.json'))
				.map<MusicData>(data => ({
					title: data.metadata.title,
					cover: `/mark/${data.mark}.png`,
					source: `/bgm/${data.source.structure}/${data.filename}.mp3`,
					info: {
						maps: data.maps,
					},
				}))
				.map<[string, MusicData]>(data => [data.source, data]),
		),
		new Map<string, MusicData>(),
	)
	function getMusicData(source: string): MusicData | undefined {
		return data.value.get(source)
	}

	return {
		isDark,
		toggleDark,
		data,
		isDataReady,
		getMusicData,
	}
})

if (import.meta.hot) {
	import.meta.hot.accept(acceptHMRUpdate(useAppStore, import.meta.hot))
}
