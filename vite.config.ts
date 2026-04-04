import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-oxc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: { overlay: false },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      devOptions: { enabled: false },
      includeAssets: ["fitnutt-logo.png"],
      manifest: {
        name: "FitNutt — Fitness Tracker",
        short_name: "FitNutt",
        description: "Track your macros, meals and supplements for a successful cut or bulk. Mobile-first PWA built for gains.",
        theme_color: "#EA5C1F",
        background_color: "#F5F5F5",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "/fitnutt-logo.png", sizes: "192x192", type: "image/png" },
          { src: "/fitnutt-logo.png", sizes: "512x512", type: "image/png" },
        ],
      },
      workbox: {
        importScripts: ["/sw-push.js"],
        navigateFallbackDenylist: [/^\/~oauth/],
        // Never serve Supabase API calls from cache — required for auth token refresh to work reliably
        runtimeCaching: [
          {
            urlPattern: ({ url }: { url: URL }) => url.hostname.includes("supabase.co"),
            handler: "NetworkOnly",
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@tanstack/react-query",
      "@tanstack/query-core",
    ],
  },
}));
