import { createHead } from '@unhead/vue/client'
import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import 'modern-normalize'
import 'virtual:pika.css'

createApp(App)
	.use(createPinia())
	.use(createHead())
	.use(router)
	.mount('#app')
