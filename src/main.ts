import { ViteSSG } from 'vite-ssg'
import App from './App.vue'
import 'virtual:windi.css'
import '@/assets/scss/main.scss'
import { routes } from './router'
import { installModules } from './modules'

export const createApp = ViteSSG(
  // the root component
  App,
  // vue-router options
  { routes },
  // function to have custom setups
  (ctx) => {
    // install plugins etc.
    installModules(ctx)
  }
)
