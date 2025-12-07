import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],
  server: {
    open: true, // Tarayıcıda otomatik aç
    port: 5173, // Port numarası
    host: true, // Tüm network interface'lerde dinle
  },
})
