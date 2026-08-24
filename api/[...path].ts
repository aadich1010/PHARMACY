// Vercel serverless entry point.
//
// The `[...path]` catch-all means every request to `/api/*` is routed to this
// single function. An Express app instance is itself a `(req, res)` request
// handler, so exporting it directly is all Vercel's Node runtime needs — the
// full original URL (e.g. `/api/tenants`) is preserved, and the app's own
// `/api/...` routes match it.
//
// `import "dotenv/config"` is a harmless no-op on Vercel (env vars come from the
// project settings) but lets `vercel dev` pick up a local `.env` file too.
import "dotenv/config";
import { createApp } from "../src/server/app";

export default createApp();
