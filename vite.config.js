import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dns from 'node:dns';

// Force Node.js to prefer IPv4 first. This prevents IPv6 connection timeouts (ETIMEDOUT)
// on systems where IPv6 routing is misconfigured or not fully supported.
dns.setDefaultResultOrder('ipv4first');

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'lucide-react',
      'recharts',
      'date-fns'
    ]
  },
  server: {
    host: true,
    port: 3000,
    proxy: {
      '/api/gas': {
        target: 'https://script.google.com',
        changeOrigin: true,
        secure: true,
        followRedirects: true,
        timeout: 60000,      // Connection timeout (60s)
        proxyTimeout: 60000, // Response timeout (60s)
        rewrite: (path) => path.replace(/^\/api\/gas/, '/macros/s/AKfycbxwV8CRKru8ka6R-zR_-XWj1QwD4F7SaSBt1whTnwGQ2Zp-km0W4MKt-oAogHFeezs6'),
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes) => {
            proxyRes.headers['access-control-allow-origin'] = '*';
          });
        }
      }
    }
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    strictPort: true
  }
});