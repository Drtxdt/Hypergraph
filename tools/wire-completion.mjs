import fs from "node:fs/promises";
async function edit(file, fn) {
  await fs.writeFile(file, fn(await fs.readFile(file, "utf8")));
}
await edit("scripts/core.js", (s) =>
  s
    .replace(
      "appearance:hexo.theme.config.appearance,",
      "appearance:hexo.theme.config.appearance,interaction:hexo.theme.config.interaction,music:hexo.theme.config.music,adsense:hexo.theme.config.adsense,counters:hexo.theme.config.counters,",
    )
    .replace(
      ".limit(3).toArray()",
      ".limit(hexo.theme.config.post.related_limit).toArray()",
    ),
);
await edit("layout/layout.njk", (s) =>
  s
    .replace("url_for('/assets/main.css')", "hg_asset('main.css')")
    .replace("url_for('/assets/main.js')", "hg_asset('main.js')")
    .replace(
      "{{ hg().footer.text }}</p>",
      "{{ hg().footer.text }}</p>{{ hg_footer() | safe }}",
    ),
);
await edit("layout/post.njk", (s) =>
  s
    .replace(
      '<section class="related">',
      '{% if hg().post.related %}<section class="related">',
    )
    .replace("</section></article>", "</section>{% endif %}</article>"),
);
await edit("layout/index.njk", (s) => {
  const lines = s.split("\n");
  const intro = lines.find((l) => l.startsWith('<section class="intro"'));
  const featured = lines.find((l) => l.startsWith("{% if hg().home.featured"));
  const posts = lines.find((l) => l.startsWith('<div class="home-body'));
  return (
    '{{ hg_slot("home:before") | safe }}\n{% for section in hg().home.sections %}\n{% if section == "intro" %}' +
    intro +
    '\n{% elif section == "featured" %}' +
    featured +
    '\n{% elif section == "posts" %}' +
    posts +
    '\n{% endif %}{% endfor %}\n{{ hg_ad("home") | safe }}\n'
  );
});
