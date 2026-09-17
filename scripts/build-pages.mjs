import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const distDir = resolve(root, "dist");
const files = ["index.html", "main.js", "styles.css", "CNAME", "LICENSE"];

rmSync(distDir, { recursive: true, force: true });
mkdirSync(distDir, { recursive: true });

for (const file of files) {
  const source = resolve(root, file);

  if (!existsSync(source)) {
    throw new Error(`Required file not found: ${file}`);
  }

  cpSync(source, resolve(distDir, file));
}
