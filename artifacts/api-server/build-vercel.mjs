import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build as esbuild } from "esbuild";
import { rm } from "node:fs/promises";

globalThis.require = createRequire(import.meta.url);

const artifactDir = path.dirname(fileURLToPath(import.meta.url));

// Vercel auto-detects Serverless Functions placed in the repo-root `api/`
// directory, so the bundled handler is emitted there as `api/index.mjs`.
const outDir = path.resolve(artifactDir, "../../api");

async function buildAll() {
  await rm(outDir, { recursive: true, force: true });

  await esbuild({
    entryPoints: [path.resolve(artifactDir, "src/handler.ts")],
    platform: "node",
    target: "node20",
    bundle: true,
    format: "esm",
    outdir: outDir,
    outExtension: { ".js": ".mjs" },
    entryNames: "index",
    logLevel: "info",
    alias: {
      "@workspace/db": path.resolve(artifactDir, "src/_workspace/db/index.ts"),
      "@workspace/api-zod": path.resolve(artifactDir, "src/_workspace/api-zod/index.ts"),
    },
    external: [
      "*.node",
      "sharp",
      "better-sqlite3",
      "sqlite3",
      "canvas",
      "bcrypt",
      "argon2",
      "fsevents",
      "pg-native",
      "pino-pretty",
    ],
    sourcemap: false,
    banner: {
      js: `import { createRequire as __bannerCrReq } from 'node:module';
import __bannerPath from 'node:path';
import __bannerUrl from 'node:url';

globalThis.require = __bannerCrReq(import.meta.url);
globalThis.__filename = __bannerUrl.fileURLToPath(import.meta.url);
globalThis.__dirname = __bannerPath.dirname(globalThis.__filename);
    `,
    },
  });
}

buildAll()
  .then(() => {
    console.log(`\n✅ Vercel function built → ${outDir}/index.mjs\n`);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
