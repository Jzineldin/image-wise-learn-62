/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { visualizer } from "rollup-plugin-visualizer";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    // Bundle analyzer - generates stats.html in dist/
    mode === "production" && visualizer({
      open: false,
      gzipSize: true,
      filename: 'dist/stats.html'
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Context7 Pattern: Bundle optimization for performance
  build: {
    rollupOptions: {
      output: {
        // Context7 Pattern: Manual chunks for vendor libraries
        manualChunks: {
          // UI Framework chunks - Context7 Pattern: Group related UI components
          'vendor-ui': [
            '@radix-ui/react-accordion',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-aspect-ratio',
            '@radix-ui/react-avatar',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-collapsible',
            '@radix-ui/react-context-menu',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-hover-card',
            '@radix-ui/react-label',
            '@radix-ui/react-menubar',
            '@radix-ui/react-navigation-menu',
            '@radix-ui/react-popover',
            '@radix-ui/react-progress',
            '@radix-ui/react-radio-group',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-select',
            '@radix-ui/react-separator',
            '@radix-ui/react-slider',
            '@radix-ui/react-slot',
            '@radix-ui/react-switch',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
            '@radix-ui/react-toggle',
            '@radix-ui/react-toggle-group',
            '@radix-ui/react-tooltip'
          ],
          // Form handling chunk
          'vendor-forms': [
            'react-hook-form',
            'zod',
            '@hookform/resolvers'
          ],
          // Charts and visualization
          'vendor-charts': [
            'recharts'
          ],
          // Utility libraries
          'vendor-utils': [
            'date-fns',
            'clsx',
            'tailwind-merge',
            'class-variance-authority'
          ],
          // Supabase and API
          'vendor-api': [
            '@supabase/supabase-js',
            '@tanstack/react-query'
          ],
          // Icons
          'vendor-icons': [
            'lucide-react'
          ]
        }
      }
    },
    // Context7 Pattern: Optimize bundle size
    chunkSizeWarningLimit: 500,
    minify: mode === 'production' ? 'esbuild' : false,
    // Remove console logs in production
    esbuild: mode === 'production' ? {
      drop: ['console', 'debugger']
    } : undefined
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test-setup.ts"],
  },
}));
