import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  // In production (bundled to CommonJS), the bundled file is at dist/index.cjs
  // and static files are at dist/public/. Since esbuild bundles to CJS,
  // __dirname will be available at runtime pointing to dist/.
  // We use a type assertion because TypeScript doesn't know about __dirname in ESM source.
  // In development (ESM), we'd use import.meta.url, but this code only runs in production.
  const distPath = path.resolve(
    // @ts-ignore - __dirname is provided by esbuild in CommonJS bundle
    typeof __dirname !== "undefined" ? __dirname : path.resolve(process.cwd(), "dist"),
    "public"
  );
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
