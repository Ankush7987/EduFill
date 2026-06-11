import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import viteCompression from 'vite-plugin-compression';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // 🚀 COMPRESSION: JS/CSS files ka size 70% tak kam kar dega
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 10240, // Sirf 10KB se badi files ko compress karega
    })
  ],
  
  // 🛠️ BUG FIX: In libraries ko pre-bundle karega taaki 'forwardRef' undefined na ho
  optimizeDeps: {
    include: ['recharts', 'react-is', 'prop-types', 'lucide-react']
  },

  build: {
    // 🛠️ BUG FIX: Mixed ES Modules (CommonJS + ESM) ko properly transform karega
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true
    },
    
    // 🚀 CHUNK SPLITTING: Badi JS file ko chote hisso me todega mobile ke liye
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Firebase sabse heavy hota hai, isko alag file me daalo
          if (id.includes('node_modules/firebase')) {
            return 'firebase-vendor';
          }
          // React aur Routing ka core engine alag
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router-dom')) {
            return 'react-core';
          }
          // Icons ko alag load hone do
          if (id.includes('node_modules/lucide-react')) {
            return 'lucide-icons';
          }
          // 📊 Recharts aur uski dependencies (d3) ko ek alag chunk me daala hai
          if (id.includes('node_modules/recharts') || id.includes('node_modules/react-smooth') || id.includes('node_modules/d3-')) {
            return 'recharts-vendor';
          }
          // Baaki bache hue saare third-party packages (node_modules) ek 'vendor' file me
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    },
    // Warning limit ko thoda badha diya taaki terminal clean rahe
    chunkSizeWarningLimit: 1000 
  }
});