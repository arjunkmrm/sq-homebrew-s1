import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { bankingRunPlugin } from './server/banking-run.ts'

export default defineConfig({
  plugins: [react(), bankingRunPlugin()],
  server: { fs: { allow: ['..'] } },
})
