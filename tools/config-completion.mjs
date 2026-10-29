import fs from "node:fs/promises";
const s = JSON.parse(await fs.readFile("config.schema.json", "utf8"));
const text = (value = "") => ({ type: "string", default: value });
const flag = (value = false) => ({ type: "boolean", default: value });
const list = (items) => ({ type: "array", default: [], items });
const obj = (properties) => ({
  type: "object",
  additionalProperties: false,
  default: {},
  properties,
});
s.properties.interaction = obj({
  translate: flag(),
  spacing: flag(),
  context_menu: flag(),
  console: flag(),
  shortcuts_help: flag(),
  greeting: text(),
  privacy_url: text(),
  privacy_version: text("1"),
  prefetch: flag(),
  anchor_update: flag(),
  loading_bar: flag(),
  random_post: flag(),
  toolbar: list({
    enum: ["mode", "reading", "toc", "comments", "sidebar", "top", "search"],
  }),
});
s.properties.resources = obj({ asset_base: text(), lazy_images: flag(true) });
s.properties.appearance.properties.mourn_days = list({
  type: "string",
  pattern: "^\\d{2}-\\d{2}$",
});
s.properties.appearance.properties.cover_tint = flag();
s.properties.appearance.properties.image_suffix = text();
s.properties.effects.properties.background = {
  enum: ["", "ribbon", "network", "stars", "bubbles"],
  default: "",
};
s.properties.effects.properties.typing = flag();
s.properties.effects.properties.click.enum = ["", "heart", "text", "fireworks"];
s.properties.effects.properties.words = list({ type: "string" });
s.properties.effects.properties.mobile = flag();
s.properties.music.properties.playlist = list(
  obj({ title: text(), src: text() }),
);
s.properties.music.properties.volume = {
  type: "number",
  minimum: 0,
  maximum: 1,
  default: 0.7,
};
s.properties.music.properties.endpoint = text();
s.properties.adsense = obj({ enable: flag(), client: text(), slot: text() });
s.properties.counters = obj({
  enable: flag(),
  endpoint: text(),
  busuanzi: flag(),
});
s.properties.footer.properties.links = list(
  obj({ title: text(), url: text(), image: text() }),
);
s.properties.home.properties.sections = {
  type: "array",
  uniqueItems: true,
  default: ["intro", "featured", "posts"],
  items: { enum: ["intro", "featured", "posts"] },
};
s.properties.post.properties.related = flag(true);
s.properties.post.properties.related_limit = {
  type: "integer",
  minimum: 0,
  maximum: 30,
  default: 3,
};
s.properties.post.properties.share_sites = list({
  enum: ["weibo", "qq", "x", "facebook", "email"],
});
s.properties.sidebar.properties.order.items.enum.push("archives");
s.properties.code.properties.language = flag(true);
s.properties.code.properties.theme = {
  enum: ["auto", "light", "dark"],
  default: "auto",
};
await fs.writeFile("config.schema.json", JSON.stringify(s, null, 2));
