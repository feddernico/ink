import { assembleSingleFile } from "./assemble-single-file.js";

export function injectTemplate(options = {}) {
  assembleSingleFile(options);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  injectTemplate();
}
