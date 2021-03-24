import { ViteSSG } from 'vite-ssg'
import App from './App.vue'
import 'virtual:windi.css'
import { routes } from './router'

export const createApp = ViteSSG(
  // the root component
  App,
  // vue-router options
  { routes },
  // function to have custom setups
  ({ app, router, isClient }) => {
    // install plugins etc.
  }
)
