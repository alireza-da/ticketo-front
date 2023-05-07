import { fileURLToPath, URL } from 'node:url'
import UnoCSS from 'unocss/vite'
import { presetAttributify, presetUno, transformerVariantGroup } from 'unocss';
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import basicSsl from '@vitejs/plugin-basic-ssl'


// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), vueJsx(), basicSsl(),
  UnoCSS({
    presets: [presetAttributify(), presetUno()],
    theme: {
      colors: {
        violet: 'hsl(257, 40%, 49%)',
        magenta: 'hsl(300, 69%, 71%)',
        white: 'hsl(0, 0%, 100%)',
      },
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
        open: ['Open Sans', 'sans-serif'],
      },
    },
    transformers: [transformerVariantGroup()],
  })],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: { https: true },
})

