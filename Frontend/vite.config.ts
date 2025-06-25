import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('@mantine') || id.includes('@emotion')) {
              return 'vendor_mantine';
            }
            if (id.includes('react') || id.includes('react-dom') || id.includes('scheduler')) {
              return 'vendor_react';
            }
            if (id.includes('@fullcalendar')) {
              return 'vendor_calendar';
            }
            if (id.includes('@tabler') || id.includes('@mantine')) {
              return 'vendor_ui';
            }
            return 'vendor';
          }
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true,
    port: 3000,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
})
