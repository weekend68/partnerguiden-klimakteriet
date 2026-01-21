import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import vitePrerender from "vite-plugin-prerender";

// Static routes that should be prerendered
const staticRoutes = [
  "/",
  "/artiklar",
  "/om",
  "/integritetspolicy",
  "/auth",
];

// Article slugs - these should be prerendered for SEO
const articleSlugs = [
  "klimakteriet-forklarat",
  "varmevallningar",
  "hjarnan-orkar-inte",
  "glomska-fokus",
  "nar-varlden-skaver",
  "oro-slapper-inte",
  "narhet-pa-nya-villkor",
  "kropp-spegelbild",
  "motivation-traning",
  "osynlighet-varde",
  "kommunikation-ar-svart",
  "sandwich-generationen",
  "hormonbehandling-hrt",
];

// Generate article routes
const articleRoutes = articleSlugs.map(slug => `/artikel/${slug}`);

// All routes to prerender
const routesToPrerender = [...staticRoutes, ...articleRoutes];

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  build: {
    sourcemap: true,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    // Only prerender in production builds
    mode === "production" && vitePrerender({
      staticDir: path.resolve(__dirname, "dist"),
      routes: routesToPrerender,
      // Wait for react-helmet-async to update the head
      captureAfterTime: 2000,
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
