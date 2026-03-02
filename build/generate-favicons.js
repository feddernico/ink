import fs from "node:fs";
import path from "node:path";

const SOURCE_LOGO_PATH = path.join("assets", "branding", "logo.svg");
const FAVICON_OUTPUT_PATH = path.join("assets", "branding", "favicon.svg");

export function generateFavicons() {
  const logoSvg = fs.readFileSync(SOURCE_LOGO_PATH, "utf8");
  fs.writeFileSync(FAVICON_OUTPUT_PATH, logoSvg);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  generateFavicons();
}
