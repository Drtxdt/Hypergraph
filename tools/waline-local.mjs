import path from "node:path";
import crypto from "node:crypto";
import http from "node:http";
import { createRequire } from "node:module";
process.env.SQLITE_PATH = path.resolve(".local/waline");
process.env.SQLITE_DB = "waline";
process.env.JWT_TOKEN = crypto.randomBytes(32).toString("hex");
process.env.SITE_URL = "http://127.0.0.1:4174";
process.env.SERVER_URL = "http://127.0.0.1:9090";
process.env.AKISMET_KEY = "false";
process.env.DISABLE_REGION = "true";
// The anonymous integration suite has no external OAuth provider dependency.
process.env.OAUTH_URL = "http://127.0.0.1:9090/test-oauth-services";
const require = createRequire(import.meta.url);
const handler = require("../deploy/waline/index.cjs");
http
  .createServer((req, res) => {
    if (req.url === "/test-oauth-services") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ services: [] }));
      return;
    }
    return handler(req, res);
  })
  .listen(9090, "127.0.0.1", () =>
    console.log("Local Waline SQLite on http://127.0.0.1:9090"),
  );
