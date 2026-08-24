// NOTE: dotenv must load BEFORE importing ./src/server/store, because the store
// reads SUPABASE_URL / keys at import time. `import "dotenv/config"` runs as the
// first hoisted side-effect import, populating process.env before store init.
import "dotenv/config";
import path from "path";
import express from "express";
import { createServer as createViteServer } from "vite";
import { createApp } from "./src/server/app";
import { ensureReady, isPersistent } from "./src/server/store";

/**
 * Local development / self-hosted production bootstrap.
 *
 * All `/api` route logic now lives in `src/server/app.ts` (`createApp`) so the
 * exact same Express app can be reused by the Vercel serverless entry
 * (`api/[...path].ts`). This file only adds the pieces that a long-lived server
 * needs but a serverless function must not have: Vite dev middleware / static
 * asset serving and `app.listen`.
 */
async function startServer() {
  const app = createApp();
  const PORT = Number(process.env.PORT) || 3000;

  // Warm up the data store (seeds Supabase on first run; no-op for in-memory).
  await ensureReady();

  // Vite middleware for development vs Static serving in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`PharmaCentral Multi-Tenant server running on http://0.0.0.0:${PORT}`);
    console.log(`[store] Persistence: ${isPersistent() ? "Supabase (Postgres)" : "in-memory (dev)"}`);
  });
}

startServer();
