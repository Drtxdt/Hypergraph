import fs from "node:fs/promises";
const s = JSON.parse(await fs.readFile("config.schema.json", "utf8"));
const p = s.properties.comments.properties;
p.provider.enum = [
  "waline",
  "artalk",
  "twikoo",
  "giscus",
  "disqus",
  "disqusjs",
  "livere",
  "valine",
  "utterances",
  "facebook",
  "remark42",
  "gitalk",
];
for (const name of [
  "shortname",
  "api_key",
  "uid",
  "app_id",
  "app_key",
  "client_id",
  "client_secret",
  "owner",
  "proxy",
])
  p[name] = { type: "string", default: "" };
p.admin = { type: "array", default: [], items: { type: "string" } };
p.lazy = { type: "boolean", default: false };
p.options = { type: "object", default: {} };
const second = structuredClone(s.properties.comments);
delete second.properties.secondary;
delete second.properties.count;
delete second.properties.recent;
delete second.properties.barrage;
p.secondary = second;
await fs.writeFile("config.schema.json", JSON.stringify(s, null, 2));
