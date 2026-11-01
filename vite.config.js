import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// SerpAPI does not send CORS headers, so browser calls go through this proxy
// (works for both `npm run dev` and `npm run preview`).
const proxy = {
  '/serpapi': {
    target: 'https://serpapi.com',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/serpapi/, ''),
  },
};

export default defineConfig({
  plugins: [react()],
  server: { proxy },
  preview: { proxy },
});
