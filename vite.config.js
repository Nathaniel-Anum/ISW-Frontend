import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  server: {
    port: 3001,
    host: true, // exposes on local network (0.0.0.0)
  },
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-antd": ["antd"],
          "vendor-charts": ["recharts"],
          "vendor-xlsx": ["xlsx", "file-saver"],
          "vendor-query": ["@tanstack/react-query"],
        },
      },
    },
  },
});
