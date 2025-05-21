import { custom, literal, object, pipe, string } from 'valibot'

export const HashActionPlayMusicSchema = object({
	type: literal('play-music'),
	data: object({
		musicSrc: pipe(
			string(),
			custom((value) => {
				const musicStore = useMusicStore()
				if (musicStore.getMusicData(value as string)) {
					return true
				}
				return false
			}),
		),
	}),
})
