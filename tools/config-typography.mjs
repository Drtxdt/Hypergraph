import fs from "node:fs/promises";
const s = JSON.parse(await fs.readFile("config.schema.json", "utf8"));
for (const [key, value, min, max] of [
  ["body_size", 17, 12, 24],
  ["code_size", 14, 10, 22],
  ["line_height", 1.95, 1.3, 2.5],
])
  s.properties.fonts.properties[key] = {
    type: "number",
    default: value,
    minimum: min,
    maximum: max,
  };
s.properties.appearance.properties.taxonomy_banners = {
  type: "object",
  default: {},
  additionalProperties: { type: "string" },
};
await fs.writeFile("config.schema.json", JSON.stringify(s, null, 2));
