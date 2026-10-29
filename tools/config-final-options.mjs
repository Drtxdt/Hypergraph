import fs from "node:fs/promises";
const s = JSON.parse(await fs.readFile("config.schema.json", "utf8"));
const text = (value = "") => ({ type: "string", default: value });
const flag = (value = false) => ({ type: "boolean", default: value });
s.properties.chat.properties.button = flag();
s.properties.chat.properties.hide_on_scroll = flag();
s.properties.analytics.items.properties.options = {
  type: "object",
  default: {},
};
s.properties.appearance.properties.footer_image = text();
s.properties.appearance.properties.divider_icon = text("");
s.properties.appearance.properties.category_layout = {
  enum: ["archive", "cards"],
  default: "archive",
};
s.properties.appearance.properties.tag_layout = {
  enum: ["archive", "cards"],
  default: "archive",
};
s.properties.appearance.properties.note_style = {
  enum: ["flat", "simple", "off"],
  default: "flat",
};
s.properties.appearance.properties.error_title = text("404");
s.properties.appearance.properties.error_message = text("");
s.properties.appearance.properties.error_image = text();
s.properties.interaction.properties.console_message = text();
s.properties.home.properties.excerpt_length = {
  type: "integer",
  minimum: 0,
  maximum: 1000,
  default: 160,
};
s.properties.home.properties.excerpt = {
  enum: ["auto", "description", "off"],
  default: "auto",
};
s.properties.appearance.properties.show_cover = flag(true);
s.properties.navigation_exclude = {
  type: "array",
  default: [],
  items: { type: "string" },
};
await fs.writeFile("config.schema.json", JSON.stringify(s, null, 2));
