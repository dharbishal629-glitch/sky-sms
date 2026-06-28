import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build as esbuild } from "esbuild";
import { mkdir } from "node:fs/promises";

globalThis.require = createRequire(import.meta.url);

const artifactDir = path.dirname(fileURLToPath(import.meta.url));

// Output a single api.mjs → Netlify picks it up as the "api" function
const outDir = path.resolve(artifactDir, "../../netlify/functions");

async function buildNetlify() {
  await mkdir(outDir, { recursive: true });

  await esbuild({
    entryPoints: [path.resolve(artifactDir, "src/netlify-handler.ts")],
    platform: "node",
    bundle: true,
    format: "esm",
    outdir: outDir,
    outExtension: { ".js": ".mjs" },
    entryNames: "api",            // output → netlify/functions/api.mjs
    logLevel: "info",
    alias: {
      "@workspace/db":      path.resolve(artifactDir, "src/_workspace/db/index.ts"),
      "@workspace/api-zod": path.resolve(artifactDir, "src/_workspace/api-zod/index.ts"),
    },
    // Pino workers are NOT needed in production (pino-pretty transport is
    // disabled when NODE_ENV=production), so we skip esbuildPluginPino here.
    // Everything else is bundled into the single api.mjs file.
    external: [
      "*.node",
      "sharp", "better-sqlite3", "sqlite3", "canvas", "bcrypt", "argon2",
      "fsevents", "re2", "farmhash", "xxhash-addon", "bufferutil",
      "utf-8-validate", "ssh2", "cpu-features", "dtrace-provider",
      "isolated-vm", "lightningcss", "pg-native", "oracledb",
      "mongodb-client-encryption", "nodemailer", "handlebars", "knex",
      "typeorm", "protobufjs", "onnxruntime-node", "@tensorflow/*",
      "@prisma/client", "@mikro-orm/*", "@grpc/*", "@swc/*", "@aws-sdk/*",
      "@azure/*", "@opentelemetry/*", "@google-cloud/*", "@google/*",
      "googleapis", "firebase-admin", "@parcel/watcher",
      "@sentry/profiling-node", "@tree-sitter/*", "aws-sdk",
      "classic-level", "dd-trace", "ffi-napi", "grpc", "hiredis",
      "kerberos", "leveldown", "miniflare", "mysql2", "newrelic", "odbc",
      "piscina", "realm", "ref-napi", "rocksdb", "sass-embedded",
      "sequelize", "serialport", "snappy", "tinypool", "usb",
      "workerd", "wrangler", "zeromq", "zeromq-prebuilt",
      "playwright", "puppeteer", "puppeteer-core", "electron",
      "pino-pretty", "thread-stream",
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

  console.log(`\n✅ Netlify function built → ${outDir}/api.mjs\n`);
}

buildNetlify().catch((err) => {
  console.error(err);
  process.exit(1);
});
