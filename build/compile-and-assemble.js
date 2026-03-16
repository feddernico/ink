import * as esbuild from "esbuild";
import * as sass from "sass";
import fs from "node:fs";
import path from "node:path";
import { assembleSingleFile } from "./assemble-single-file.js";
import { generateFavicons } from "./generate-favicons.js";

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
  generateFavicons();
  await buildJavaScript();
  buildStyles();
  assembleSingleFile();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  buildAll().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}