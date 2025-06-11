/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/vue" />
/// <reference types="vite-plugin-pwa/info" />

declare const __GIT_COMMIT_HASH__: string

interface ImportMetaEnv {
	readonly VITE_APP_WORKER_URL: string
	readonly VITE_APP_MAGIC_HEADER_KEY: string
	readonly VITE_APP_MAGIC_HEADER_VALUE: string
}

interface ImportMeta {
	readonly env: ImportMetaEnv
}
