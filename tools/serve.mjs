import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
const root = path.resolve(process.argv[2] || ".local/blog/public");
const port = Number(process.argv[3] || 4173);
const mount = process.argv[4] || "";
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".woff2": "font/woff2",
  ".mp3": "audio/mpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};
http
  .createServer(async (req, res) => {
    try {
      let name = decodeURIComponent(
        new URL(req.url, "http://localhost").pathname,
      );
      if (mount) {
        if (!name.startsWith(mount + "/")) throw Error("mount");
        name = name.slice(mount.length);
      }
      if (name.endsWith("/")) name += "index.html";
      const file = path.resolve(root, "." + name);
      if (!file.startsWith(root + path.sep)) throw Error("path");
      const data = await fs.readFile(file);
      res.writeHead(200, {
        "Content-Type": types[path.extname(file)] || "application/octet-stream",
      });
      res.end(data);
    } catch {
      res.writeHead(404);
      res.end("Not found");
    }
  })
  .listen(port, "127.0.0.1", () =>
    console.log(`Preview http://127.0.0.1:${port}${mount}`),
  );
