import { defineConfig } from 'vite-plugin-windicss'
import colors from'windicss/colors'

export default defineConfig({
  darkMode: 'class',
  theme: {
    colors: {
      ...colors,
      'app-light': '#DFDFDF',
      'app-dark': '#333333'
    }
  }
})