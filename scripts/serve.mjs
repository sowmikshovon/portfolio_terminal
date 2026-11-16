import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const DIST_DIR = path.join(ROOT, "dist");
const SERVE_DIR = fs.existsSync(DIST_DIR) ? DIST_DIR : ROOT;
const PORT = Number(process.env.PORT) || 3001;

const CONTENT_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

function sendText(res, statusCode, message) {
  res.writeHead(statusCode, { "Content-Type": "text/plain; charset=utf-8" });
  res.end(message);
}

const server = http.createServer((req, res) => {
  const method = req.method || "GET";
  if (method !== "GET" && method !== "HEAD") {
    sendText(res, 405, "Method Not Allowed");
    return;
  }

  let pathname;
  try {
    const rawPath = (req.url || "/").split(/[?#]/, 1)[0];
    pathname = decodeURIComponent(rawPath);
  } catch {
    sendText(res, 400, "Bad Request");
    return;
  }

  if (pathname.includes("\0")) {
    sendText(res, 400, "Bad Request");
    return;
  }

  const normalizedRel = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const resolvedPath = path.resolve(SERVE_DIR, normalizedRel);
  const relativeFromBase = path.relative(SERVE_DIR, resolvedPath);

  if (relativeFromBase.startsWith("..") || path.isAbsolute(relativeFromBase)) {
    sendText(res, 403, "Forbidden");
    return;
  }

  let targetPath = resolvedPath;
  if (fs.existsSync(targetPath) && fs.statSync(targetPath).isDirectory()) {
    targetPath = path.join(targetPath, "index.html");
  }

  if (!fs.existsSync(targetPath) || !fs.statSync(targetPath).isFile()) {
    sendText(res, 404, "Not Found");
    return;
  }

  const ext = path.extname(targetPath).toLowerCase();
  const contentType = CONTENT_TYPES[ext] || "application/octet-stream";

  fs.readFile(targetPath, (err, data) => {
    if (err) {
      sendText(res, 500, "Internal Server Error");
      return;
    }
    res.writeHead(200, {
      "Content-Type": contentType,
      "Content-Length": data.length,
    });
    if (method === "HEAD") {
      res.end();
    } else {
      res.end(data);
    }
  });
});

server.listen(PORT, () => {
  console.log(
    `Terminal Portfolio build server listening at http://localhost:${PORT} (serving ${SERVE_DIR})`
  );
});
