import chokidar from "chokidar";
import { buildAll } from "./build.js";

let inProgress = false;
let queued = false;

async function runBuild() {
  if (inProgress) {
    queued = true;
    return;
  }

  inProgress = true;

  try {
    await buildAll();
    console.log(`[watch] build completed at ${new Date().toISOString()}`);
  } catch (error) {
    console.error("[watch] build failed", error);
  } finally {
    inProgress = false;
    if (queued) {
      queued = false;
      await runBuild();
    }
  }
}

await runBuild();

const watcher = chokidar.watch(["src/**/*.ts", "src/**/*.scss", "ink.template.html"], {
  ignoreInitial: true,
});

watcher.on("all", async (event, changedPath) => {
  console.log(`[watch] ${event}: ${changedPath}`);
  await runBuild();
});
