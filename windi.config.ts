import { defineConfig } from 'vite-plugin-windicss'
import colors from 'windicss/colors'

export default defineConfig({
  darkMode: 'class',
  theme: {
    screens: {
      xsOnly: { max: 575 },
      smAndDown: { max: 767 },
      smOnly: { min: 576, max: 767 },
      smAndUp: { min: 576 },
      mdAndDown: { max: 991 },
      mdOnly: { min: 768, max: 991 },
      mdAndUp: { min: 768 },
      lgAndDown: { max: 1199 },
      lgOnly: { min: 992, max: 1199 },
      lgAndUp: { min: 992 },
      xlAndDown: { max: 1399 },
      xlOnly: { min: 1200, max: 1399 },
      xlAndUp: { min: 1200 },
      xxlOnly: { min: 1400 }
    },
    colors: {
      ...colors,
      'app-light': '#DFDFDF',
      'app-dark': '#333333',
      primary: '#E36262',
      secondary: '#B5B5B5'
    }
  }
})
