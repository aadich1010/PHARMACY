// Vercel serverless entry point.
//
// A rewrite in vercel.json funnels every `/api/*` request to this single
// function ("/api/(.*)" -> "/api"), and Vercel preserves the ORIGINAL request
// URL (e.g. `/api/tenants`), so the Express app's own `/api/...` routes match.
// An Express app instance is itself a `(req, res)` handler, so exporting it
// directly is all Vercel's Node runtime needs.
//
// `import "dotenv/config"` is a harmless no-op on Vercel (env vars come from the
// project settings) but lets `vercel dev` pick up a local `.env` file too.
import "dotenv/config";
import { createApp } from "../src/server/app";

export default createApp();
