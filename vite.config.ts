import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve('.', './src'),
      },
    },
    define: {
      'import.meta.env.VITE_API_BASE': JSON.stringify(env.VITE_API_BASE)
    },
    build: {
      rollupOptions: {
        external: ['@capgo/capacitor-social-login', '@radix-ui/react-dialog', '@radix-ui/react-label', '@radix-ui/react-slot', 'clsx', 'framer-motion', 'lucide-react', 'react', 'react-dom', 'react-router-dom', 'tailwind-merge', 'tailwindcss-animate', 'react-countup', 'reaviz', '@hello-pangea/dnd']
      }
    }
  }
});

