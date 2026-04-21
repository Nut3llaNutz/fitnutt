import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: { overlay: false },
    allowedHosts: true
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      devOptions: { enabled: true },
      // manifest.webmanifest lives in /public — Vite copies it verbatim.
      // manifest: false tells vite-plugin-pwa not to generate one, suppressing
      // the "theme_color missing" warning (we manage the file ourselves).
      manifest: false,
      includeAssets: ["fitnutt-logo.png", "manifest.webmanifest"],
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
