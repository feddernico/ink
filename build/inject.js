import fs from "node:fs";

export function injectTemplate({
  templatePath = "ink.template.html",
  javascriptPath = "dist/app.min.js",
  cssPath = "dist/styles.min.css",
  outputPath = "ink-app.html",
} = {}) {
  const html = fs.readFileSync(templatePath, "utf8");
  const js = fs.readFileSync(javascriptPath, "utf8");
  const css = fs.readFileSync(cssPath, "utf8");

  const output = html
    .replace("/*__INLINE_CSS__*/", css)
    .replace("//__INLINE_JS__", js);

  fs.writeFileSync(outputPath, output);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  injectTemplate();
}
