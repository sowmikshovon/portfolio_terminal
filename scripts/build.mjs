import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const DIST_DIR = path.join(ROOT, "dist");

const ARTIFACT_FILES = [
  "index.html",
  "index.css",
  "index.js",
  "sowmikshovon.txt",
];

function validateTagBalance(content, filename) {
  const tagRegex = /<(\/?)(span|a|p)(?=[\s>])[^>]*>/gi;
  const stack = [];
  let match;

  while ((match = tagRegex.exec(content)) !== null) {
    const fullTag = match[0];
    const isClosing = match[1] === "/";
    const tagName = match[2].toLowerCase();
    const isSelfClosing = !isClosing && fullTag.endsWith("/>");

    if (isSelfClosing) {
      continue;
    }

    const lineNumber = content.slice(0, match.index).split(/\r?\n/).length;

    if (!isClosing) {
      stack.push({ tagName, lineNumber });
    } else {
      if (stack.length === 0) {
        throw new Error(
          `${filename}:${lineNumber} has unexpected closing </${tagName}> with no matching opening tag`
        );
      }
      const last = stack.pop();
      if (last.tagName !== tagName) {
        throw new Error(
          `${filename}:${lineNumber} has mismatched </${tagName}> (expected </${last.tagName}> opened at line ${last.lineNumber})`
        );
      }
    }
  }

  if (stack.length > 0) {
    const unclosed = stack
      .map((entry) => `<${entry.tagName}> (line ${entry.lineNumber})`)
      .join(", ");
    throw new Error(`${filename} has unclosed HTML tags: ${unclosed}`);
  }
}

function build() {
  for (const file of ARTIFACT_FILES) {
    const srcPath = path.join(ROOT, file);
    if (!fs.existsSync(srcPath)) {
      throw new Error(`Missing required source file: ${srcPath}`);
    }
    const stat = fs.statSync(srcPath);
    if (!stat.isFile() || stat.size === 0) {
      throw new Error(`Source file is empty or not a regular file: ${srcPath}`);
    }
    const content = fs.readFileSync(srcPath, "utf8");
    if (content.trim().length === 0) {
      throw new Error(`Source file contains only whitespace: ${srcPath}`);
    }
    if (file === "sowmikshovon.txt") {
      validateTagBalance(content, file);
    }
  }

  fs.rmSync(DIST_DIR, { recursive: true, force: true });
  fs.mkdirSync(DIST_DIR, { recursive: true });

  console.log(`Building Terminal Portfolio static bundle into ${DIST_DIR}`);

  for (const file of ARTIFACT_FILES) {
    const srcPath = path.join(ROOT, file);
    const destPath = path.join(DIST_DIR, file);
    fs.copyFileSync(srcPath, destPath);
    const { size } = fs.statSync(destPath);
    console.log(`  - ${destPath} (${size} bytes)`);
  }

  console.log("Build completed successfully.");
}

try {
  build();
} catch (error) {
  console.error(`Build failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
