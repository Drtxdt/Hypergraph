import assert from "node:assert/strict";
import fs from "node:fs/promises";
const url = "http://127.0.0.1:9090/api/comment";
const headers = {
  "Content-Type": "application/json",
  Origin: "http://127.0.0.1:4174",
};
const marker = "Hypergraph-local-" + Date.now();
const result = await fetch(url, {
  method: "POST",
  headers,
  body: JSON.stringify({
    comment: marker,
    nick: "Local integration test",
    mail: "test@example.invalid",
    url: "/integration-test/",
    ua: "Hypergraph test",
    link: "",
  }),
}).then((r) => r.json());
assert.equal(result.errno, 0, JSON.stringify(result));
const list = await fetch(url + "?path=%2Fintegration-test%2F", {
  headers,
}).then((r) => r.json());
assert.equal(list.errno, 0);
assert.ok(JSON.stringify(list.data).includes(marker));
await fs.writeFile(
  ".local/waline-integration.json",
  JSON.stringify(
    { database: "SQLite", anonymousPost: true, readBack: true, marker },
    null,
    2,
  ),
);
console.log("Waline SQLite anonymous comment persisted and read back.");
