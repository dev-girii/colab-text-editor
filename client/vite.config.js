import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  optimizeDeps: {
    include: ['yjs', 'y-websocket', 'y-quill', 'quill', 'quill-cursors'],
  },
})
