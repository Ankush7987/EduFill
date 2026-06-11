import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import viteCompression from 'vite-plugin-compression';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // 🚀 COMPRESSION: JS/CSS files ka size kam karega
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 10240,
    })
  ],
  
  // 🛠️ BUG FIX: React aur Recharts ko ek sath pre-bundle karega
  optimizeDeps: {
    include: ['react', 'react-dom', 'recharts', 'lucide-react']
  },

  build: {
    // 🛠️ BUG FIX: Mixed ES Modules ko allow karega
    commonjsOptions: {
      transformMixedEsModules: true
    },
    // Warning limit badha di taaki terminal clean rahe
    chunkSizeWarningLimit: 2000 
  }
});