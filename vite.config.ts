import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
// touch: force dev-server to reload env vars (refreshed at 2025-10-15T10:05:00Z)
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  // Fallbacks ensure the app boots even if envs are not injected yet
  const FALLBACK_URL = "https://czqnckhxfuwycipssyyg.supabase.co";
  const FALLBACK_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6cW5ja2h4ZnV3eWNpcHNzeXlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3OTcxMzAsImV4cCI6MjA3NTM3MzEzMH0.S9h-r4s-VHL352kq5FH_IJ7pMLXG8XzG-eSNKJj6_V4";

  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [
      react(),
      mode === "development" && componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    define: {
      // Inject values at build-time; if real envs exist they take precedence
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(env.VITE_SUPABASE_URL || FALLBACK_URL),
      "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(env.VITE_SUPABASE_PUBLISHABLE_KEY || FALLBACK_KEY),
      "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(env.VITE_SUPABASE_PUBLISHABLE_KEY || FALLBACK_KEY),
    },
  };
});
