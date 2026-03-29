import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const sourceDir = path.join(projectRoot, "node_modules", "ogv", "dist");
const targetDir = path.join(projectRoot, "public", "ogv");

async function syncOgvDist() {
    await mkdir(path.join(projectRoot, "public"), { recursive: true });
    await rm(targetDir, { recursive: true, force: true });
    await cp(sourceDir, targetDir, { recursive: true });
    console.log("Synced ogv dist files to public/ogv");
}

syncOgvDist().catch(error => {
    console.error("Failed to sync ogv dist files:", error);
    process.exit(1);
});
