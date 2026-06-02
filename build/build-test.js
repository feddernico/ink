import * as esbuild from "esbuild";
import fs from "node:fs";

const bundles = [
  {
    entryPoints: ["src/tags.ts"],
    outfile: "dist/test/tags.js",
  },
  {
    entryPoints: ["src/test-support/storage-fixture.ts"],
    outfile: "dist/test/storage.js",
  },
  {
    entryPoints: ["src/app/fs-api.ts"],
    outfile: "dist/test/fs-api.js",
  },
  {
    entryPoints: ["src/app/utils.ts"],
    outfile: "dist/test/utils.js",
  },
  {
    entryPoints: ["src/app/cogito.ts"],
    outfile: "dist/test/cogito.js",
  },
  {
    entryPoints: ["src/auth/github.ts"],
    outfile: "dist/test/github.js",
  },
  {
    entryPoints: ["src/auth/user.ts"],
    outfile: "dist/test/user.js",
  },
  {
    entryPoints: ["src/app/editor-preview.ts"],
    outfile: "dist/test/editor-preview.js",
  },
  {
    entryPoints: ["src/app/document-linter/document-linter.ts"],
    outfile: "dist/test/document-linter.js",
  },
];

function ensureTestDist() {
  fs.mkdirSync("dist/test", { recursive: true });
}

export async function buildTestBundles() {
  ensureTestDist();
  for (const bundle of bundles) {
    await esbuild.build({
      ...bundle,
      bundle: true,
      platform: "node",
      format: "esm",
    });
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  buildTestBundles().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
