import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH || '/',
  ...(mode === 'lib' ? {
    build: {
      lib: {
        entry: 'src/index.js',
        name: 'I94Calculator',
        fileName: 'i94-calculator',
      },
      rollupOptions: {
        external: ['react', 'react-dom'],
        output: { globals: { react: 'React', 'react-dom': 'ReactDOM' } },
      },
    },
  } : {}),
}))
