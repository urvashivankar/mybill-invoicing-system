import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

try {
  const src = "C:\\Users\\urvashi\\.gemini\\antigravity-ide\\brain\\5858b813-9186-4924-8fe3-0d2a4c4fd86e\\media__1789208453244.png";
  const dest = path.resolve(__dirname, "public/logo.png");
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
  }
} catch (e) {
  console.error(e);
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['lucide-react']
        }
      }
    }
  }
})
