import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      '/api/kbai': {
        target: 'https://api.kbai.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/kbai/, '/MCP/sse'),
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // Log the actual request being made
            console.log('Proxying request:', req.method, req.url);
            console.log('Target URL:', proxyReq.path);
            console.log('Headers:', proxyReq.getHeaders());
            
            // Set SSE-specific headers
            proxyReq.setHeader('Accept', 'text/event-stream');
            proxyReq.setHeader('Cache-Control', 'no-cache');
            proxyReq.setHeader('Connection', 'keep-alive');
          });
          
          proxy.on('proxyRes', function(proxyRes, req, res) {
            console.log('Proxy response status:', proxyRes.statusCode);
            console.log('Proxy response headers:', proxyRes.headers);
            
            // Add CORS headers
            proxyRes.headers['Access-Control-Allow-Origin'] = '*';
            proxyRes.headers['Access-Control-Allow-Methods'] = 'GET,POST,OPTIONS';
            proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type,x-auth-token,x-kb-token';
            
            // Preserve SSE content type
            if (proxyRes.headers['content-type']?.includes('text/event-stream')) {
              proxyRes.headers['content-type'] = 'text/event-stream';
              proxyRes.headers['cache-control'] = 'no-cache';
            }
          });
          
          proxy.on('error', (err, req, res) => {
            console.error('Proxy error:', err);
          });
        },
        // Important for SSE
        ws: false, // Disable WebSocket upgrade for SSE
        timeout: 0, // No timeout for SSE
        proxyTimeout: 0, // No proxy timeout for SSE
      }
    }
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
