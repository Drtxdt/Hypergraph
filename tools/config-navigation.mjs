import fs from "node:fs/promises";
const s = JSON.parse(await fs.readFile("config.schema.json", "utf8"));
s.properties.menu.additionalProperties = {
  oneOf: [
    { type: "string" },
    { type: "object", additionalProperties: { type: "string" } },
  ],
};
s.properties.analytics.items.properties.provider.enum.push(
  "cnzz",
  "51la",
  "custom",
);
s.properties.chat.properties.provider.enum.push(
  "knocket",
  "daovoice",
  "custom",
);
s.properties.ads.items.properties.slot.enum.push("sidebar");
await fs.writeFile("config.schema.json", JSON.stringify(s, null, 2));
const file = "layout/layout.njk";
let template = await fs.readFile(file, "utf8");
template = template.replace(
  '{% for label,href in hg().menu %}<a href="{{ url_for(href) }}">{{ hg_t(label) }}</a>{% endfor %}',
  "{{ hg_menu() | safe }}",
);
await fs.writeFile(file, template);
