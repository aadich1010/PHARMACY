// Vercel serverless entry point.
//
// A rewrite in vercel.json funnels every `/api/*` request to this single
// function ("/api/(.*)" -> "/api"), preserving the original URL so the Express
// app's own `/api/...` routes match.
//
// IMPORTANT: the Express app is imported STATICALLY. Vercel's bundler (esbuild)
// inlines statically-imported project files (app.ts, store.ts, initialData,
// types) into this one function file. A *dynamic* import() is instead left as a
// live runtime import to a path that does not exist in the deployment bundle
// (ERR_MODULE_NOT_FOUND) — so it must not be used here.
//
// We also wrap the app in an explicit (req, res) handler rather than
// `export default app`, which is the most reliable invocation shape for
// Vercel's Node runtime under ESM. createApp() runs at module load but is
// guarded so any init failure is surfaced as JSON instead of an opaque
// FUNCTION_INVOCATION_FAILED.
import "dotenv/config";
import { createApp } from "../src/server/app";

let app: any = null;
let loadError: unknown = null;
try {
  app = createApp();
} catch (e) {
  loadError = e;
}

export default function handler(req: any, res: any) {
  if (loadError) {
    const err = loadError as any;
    res.status(500).json({
      error: "init_failed",
      message: String(err?.message || err),
      stack: String(err?.stack || "").split("\n").slice(0, 12),
    });
    return;
  }
  return app(req, res);
}
