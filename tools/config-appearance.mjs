import fs from "node:fs/promises";
const schema = JSON.parse(await fs.readFile("config.schema.json", "utf8"));
const string = (value) => ({ type: "string", default: value });
const bool = (value) => ({ type: "boolean", default: value });
const number = (value, min, max) => ({
  type: "number",
  default: value,
  minimum: min,
  maximum: max,
});
schema.properties.appearance = {
  type: "object",
  default: {},
  additionalProperties: false,
  properties: {
    favicon: string("/hypergraph.svg"),
    avatar: string(""),
    author_status: string(""),
    hero: {
      type: "object",
      default: {},
      additionalProperties: false,
      properties: {
        home: string(""),
        archive: string(""),
        category: string(""),
        tag: string(""),
        page: string(""),
        height: number(260, 80, 700),
      },
    },
    fallback_image: string(""),
    radius: number(0, 0, 32),
    justify: bool(false),
    table_stripes: bool(true),
    heading_divider: bool(true),
    captions: bool(false),
    grayscale: bool(false),
    entrance: bool(false),
  },
};
schema.properties.post.properties.meta = {
  type: "array",
  uniqueItems: true,
  default: ["date", "reading"],
  items: { enum: ["date", "updated", "reading", "words"] },
};
schema.properties.footer.properties.start_date = string("");
await fs.writeFile("config.schema.json", JSON.stringify(schema, null, 2));
