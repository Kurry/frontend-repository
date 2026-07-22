import { defineConfig, presetUno } from 'unocss'

export default defineConfig({
  presets: [presetUno()],
  theme: {
    colors: {
      primary: '#FDE047',
      accent: '#FDE047',
      background: '#FFFFFF',
      textPrimary: '#713F12',
      link: '#713F12',
    },
  },
})
