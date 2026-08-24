// Source for the Vercel serverless function.
//
// This file is NOT what Vercel runs directly. During the build it is bundled by
// esbuild into `api/index.js` (a single self-contained file, with node_modules
// kept external). That matters because Vercel's ESM runtime does not resolve our
// extensionless relative imports (`./app`, `../../types`, ...) at runtime and
// does not reliably include files outside `/api` in the function — bundling
// inlines the entire server module tree so nothing is resolved at runtime.
//
// The Express app is wrapped in an explicit (req, res) handler (rather than
// `export default app`), the most reliable invocation shape for Vercel's Node
// runtime. createApp() runs at load but is guarded so any initialization failure
// is surfaced as JSON instead of an opaque FUNCTION_INVOCATION_FAILED.
import "dotenv/config";
import { createApp } from "./app";

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
