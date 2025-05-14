export interface MusicData {
	title: string
	cover: string
	source: string
	info: {
		maps: {
			street: string
			map: string
		}[]
	}
}
