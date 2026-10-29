import fs from "node:fs/promises";
const s = JSON.parse(await fs.readFile("config.schema.json", "utf8"));
s.properties.seo = {
  type: "object",
  default: {},
  additionalProperties: false,
  properties: {
    open_graph: { type: "boolean", default: true },
    structured_data: { type: "boolean", default: true },
    twitter: { type: "string", default: "" },
  },
};
await fs.writeFile("config.schema.json", JSON.stringify(s, null, 2));
let template = await fs.readFile("layout/layout.njk", "utf8");
template = template.replace(
  /<meta property="og:title"[\s\S]*?<meta property="og:url"[^>]*>/,
  "",
);
await fs.writeFile("layout/layout.njk", template);
for (const file of ["layout/index.njk", "layout/collection.njk"]) {
  let text = await fs.readFile(file, "utf8");
  text = text
    .replaceAll("url_for(post.cover)", "hg_image(post.cover)")
    .replaceAll("url_for(item.image)", "hg_image(item.image)");
  await fs.writeFile(file, text);
}
