import * as esbuild from "esbuild";
import * as sass from "sass";
import fs from "node:fs";
import path from "node:path";
import { injectTemplate } from "./inject.js";

function ensureDist() {
  fs.mkdirSync("dist", { recursive: true });
}

async function buildJavaScript() {
  await esbuild.build({
    entryPoints: ["src/app.ts"],
    bundle: true,
    format: "iife",
    minify: true,
    target: ["es2018"],
    outfile: "dist/app.min.js",
  });
}

function buildStyles() {
  const result = sass.compile("src/styles.scss", { style: "compressed" });
  const outputPath = path.join("dist", "styles.min.css");
  fs.writeFileSync(outputPath, result.css);
}

export async function buildAll() {
  ensureDist();
  await buildJavaScript();
  buildStyles();
  injectTemplate();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  buildAll().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
