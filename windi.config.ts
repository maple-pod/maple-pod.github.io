import { defineConfig } from 'vite-plugin-windicss'
import colors from 'windicss/colors'
import { breakpointsForWindi } from './common/breakpoints'

export default defineConfig({
  darkMode: 'class',
  theme: {
    screens: {
      ...breakpointsForWindi
    },
    colors: {
      ...colors,
      'app-light': '#DFDFDF',
      'app-dark': '#333333',
      'music-player-light': '#FFFFFF',
      'music-player-dark': '#555555',
      primary: '#E36262',
      secondary: '#B5B5B5'
    }
  }
})
