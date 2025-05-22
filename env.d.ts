/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_APP_WORKER_URL: string
	readonly VITE_APP_MAGIC_HEADER_KEY: string
	readonly VITE_APP_MAGIC_HEADER_VALUE: string
}

interface ImportMeta {
	readonly env: ImportMetaEnv
}
