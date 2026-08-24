// Vercel serverless entry point.
//
// A rewrite in vercel.json funnels every `/api/*` request to this single
// function ("/api/(.*)" -> "/api"), preserving the original URL so the Express
// app's own `/api/...` routes match.
//
// We wrap the Express app in an explicit (req, res) handler (rather than
// `export default app`) because that is the most reliable shape for Vercel's
// Node runtime in an ESM project. The app is created lazily and cached across
// invocations; any initialization failure is surfaced as JSON so it is
// diagnosable instead of an opaque FUNCTION_INVOCATION_FAILED.
import "dotenv/config";

let appPromise: Promise<any> | null = null;
function getApp(): Promise<any> {
  if (!appPromise) {
    appPromise = import("../src/server/app").then((m) => m.createApp());
  }
  return appPromise;
}

export default async function handler(req: any, res: any) {
  try {
    const app = await getApp();
    return app(req, res);
  } catch (e: any) {
    if (!res.headersSent) {
      res.status(500).json({
        error: "init_failed",
        message: String(e?.message || e),
        stack: String(e?.stack || "").split("\n").slice(0, 12),
      });
    }
  }
}
