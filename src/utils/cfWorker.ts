import { ofetch } from 'ofetch'

const baseURL = `${import.meta.env.VITE_APP_WORKER_URL}/api`

export async function getRecord(recordId: string) {
	try {
		const {
			value,
		} = await ofetch<{ value: string }>(`/records/${recordId}`, {
			baseURL,
			method: 'GET',
			headers: {
				[import.meta.env.VITE_APP_MAGIC_HEADER_KEY]: import.meta.env.VITE_APP_MAGIC_HEADER_VALUE,
			},
			timeout: 3000,
		})
		return value
	}
	catch (error) {
		console.error('Error getting record:', error)
		return null
	}
}
