import fs from "node:fs/promises";
const schema = JSON.parse(await fs.readFile("config.schema.json", "utf8"));
const object = (properties) => ({
  type: "object",
  additionalProperties: false,
  default: {},
  properties,
});
const flag = (value) => ({ type: "boolean", default: value });
const text = (value) => ({ type: "string", default: value });
schema.properties.post = object({
  share: flag(true),
  copyright: flag(true),
  license: text("CC BY-NC-SA 4.0"),
  pagination: flag(true),
  summary: flag(true),
  outdated_days: { type: "integer", minimum: 0, default: 0 },
  edit_url: text(""),
  reward: {
    type: "array",
    default: [],
    items: {
      type: "object",
      additionalProperties: false,
      required: ["name", "image"],
      properties: { name: { type: "string" }, image: { type: "string" } },
    },
  },
});
schema.properties.sidebar = object({
  enable: flag(false),
  order: {
    type: "array",
    default: [
      "profile",
      "announcement",
      "latest",
      "categories",
      "tags",
      "stats",
    ],
    uniqueItems: true,
    items: {
      enum: [
        "profile",
        "announcement",
        "latest",
        "categories",
        "tags",
        "stats",
      ],
    },
  },
  announcement: text(""),
});
schema.properties.fonts = object({
  body: text('system-ui, "Microsoft YaHei", sans-serif'),
  display: text("Barlow, system-ui, sans-serif"),
  code: text("ui-monospace, Consolas, monospace"),
});
schema.properties.code = object({
  copy: flag(true),
  wrap: flag(false),
  fold: flag(false),
  max_height: { type: "integer", minimum: 0, default: 0 },
});
schema.properties.social = {
  type: "array",
  default: [],
  items: {
    type: "object",
    additionalProperties: false,
    required: ["label", "url"],
    properties: { label: { type: "string" }, url: { type: "string" } },
  },
};
schema.properties.footer = object({
  text: text(""),
  since: { type: "integer", minimum: 1970, maximum: 2200, default: 2026 },
});
schema.properties.inject = object({
  head: { type: "array", default: [], items: { type: "string" } },
  body: { type: "array", default: [], items: { type: "string" } },
});
schema.properties.background = object({
  image: text(""),
  opacity: { type: "number", minimum: 0, maximum: 1, default: 0.12 },
});
await fs.writeFile("config.schema.json", JSON.stringify(schema, null, 2));
