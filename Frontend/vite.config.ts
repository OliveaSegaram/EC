import { defineConfig, splitVendorChunkPlugin } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';
import { visualizer } from 'rollup-plugin-visualizer';
import path from 'path';

export default defineConfig(({ mode }) => ({
  plugins: [
    react(), 
    tailwindcss(),
    splitVendorChunkPlugin(),
    mode === 'analyze' && visualizer({
      open: true,
      filename: 'dist/stats.html',
      gzipSize: true,
      brotliSize: true,
    }),
  ].filter(Boolean),
  build: {
    chunkSizeWarningLimit: 1500, // Increased from default 1000
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            // Group large dependencies
            if (id.includes('react') || id.includes('react-dom') || id.includes('scheduler')) {
              return 'vendor_react';
            }
            if (id.includes('@mantine') || id.includes('@emotion')) {
              return 'vendor_mantine';
            }
            if (id.includes('@fullcalendar')) {
              return 'vendor_calendar';
            }
            if (id.includes('@tabler')) {
              return 'vendor_icons';
            }
            if (id.includes('date-fns') || id.includes('dayjs') || id.includes('moment')) {
              return 'vendor_dates';
            }
            if (id.includes('lodash') || id.includes('ramda')) {
              return 'vendor_utils';
            }
            if (id.includes('axios') || id.includes('ky')) {
              return 'vendor_http';
            }
            // Group all other node_modules
            return 'vendor';
          }
        },
      },
    },
    // Enable better minification
    minify: 'terser',
    // Enable gzip compression
    reportCompressedSize: true,
    // Disable sourcemaps in production for smaller build size
    sourcemap: mode !== 'production',
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
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@mantine/core',
      '@mantine/hooks',
      // Add other commonly used dependencies here
    ],
    // Enable esbuild optimizations
    esbuildOptions: {
      target: 'es2020',
    },
  },
  // Enable CSS code splitting
  css: {
    modules: {
      localsConvention: 'camelCaseOnly',
    },
  },
}));
