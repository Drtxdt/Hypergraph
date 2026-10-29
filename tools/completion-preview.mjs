import fs from "node:fs/promises";
import path from "node:path";
import yaml from "js-yaml";
const root = ".local/completion";
await fs.mkdir(root, { recursive: true });
await fs.copyFile(".local/demo/_config.yml", root + "/_config.yml");
await fs.cp(".local/demo/source", root + "/source", { recursive: true });
await fs.cp(".local/demo/node_modules", root + "/node_modules", {
  recursive: true,
});
await fs.copyFile(".local/demo/package.json", root + "/package.json");
await fs.writeFile(
  root + "/_config.hypergraph.yml",
  yaml.dump({
    navigation: true,
    comments: { enable: false },
    pwa: { enable: true },
    appearance: {
      captions: true,
      avatar: "/hypergraph.svg",
      fallback_image: "/hypergraph.svg",
      hero: { home: "/hypergraph.svg", page: "/hypergraph.svg" },
      radius: 8,
    },
    interaction: {
      translate: true,
      spacing: true,
      context_menu: true,
      console: true,
      shortcuts_help: true,
      greeting: "Hello {hour}",
      privacy_url: "/about/",
      prefetch: true,
      loading_bar: true,
      toolbar: [
        "mode",
        "reading",
        "toc",
        "comments",
        "sidebar",
        "top",
        "search",
      ],
    },
    footer: {
      start_date: "2020-01-01",
      links: [{ title: "Hexo", url: "https://hexo.io/" }],
    },
    sidebar: { enable: true, order: ["profile", "archives", "latest"] },
    music: {
      enable: true,
      src: "/audio/bgm.mp3",
      title: "Track one",
      playlist: [
        { src: "/audio/bgm.mp3", title: "Track one" },
        { src: "/audio/bgm.mp3", title: "Track two" },
      ],
    },
    pages: { gallery: { enable: true }, music: { enable: true } },
    post: {
      meta: ["date", "updated", "reading", "words"],
      share_sites: ["weibo", "qq", "x", "facebook", "email"],
    },
  }),
);
await fs.mkdir(root + "/source/audio", { recursive: true });
await fs.copyFile(
  ".local/blog/source/audio/bgm.mp3",
  root + "/source/audio/bgm.mp3",
);
const fixture = `---
title: 完整组件验证 · Components
date: '2026-10-29 09:00:00'
comments: false
series: 验证系列
---
## 阅读与交互
中文Hexo文字。记录音乐，连接网络。

{% hideInline 秘密文字, 点击显示 %}
{% hideToggle 展开内容 %}折叠正文{% endhideToggle %}

{% tabs examples %}
<!-- tab First -->
第一个面板。
<!-- endtab -->
<!-- tab Second -->
第二个面板。
<!-- endtab -->
{% endtabs %}

{% warning [兼容警告] [open] [red] %}保留 Markdown **内容**。{% endwarning %}
{% note 提示 %}注意事项。{% endnote %}
{% button Hexo, https://hexo.io %}
{% link Hexo, https://hexo.io, 官方站点 %}
{% image /hypergraph.svg, 原创图标, 240 %}
{% inlineImg /hypergraph.svg, 行内图标, 24 %}
{% media audio, /audio/bgm.mp3, 音频样例 %}
{% series 验证系列 %}
{% flink %}
- title: Hexo
  url: https://hexo.io
  description: 博客框架
{% endflink %}

## 代码与表格

\`\`\`javascript
const example = "复制正文，不含行号";
\`\`\`

| Header | Value |
|---|---|
| Example | 42 |

![图注样例](/hypergraph.svg)
![失败图片](/missing-image.png)
`;
await fs.writeFile(root + "/source/_posts/components.md", fixture);
const data = yaml.load(
  await fs.readFile(root + "/source/_data/hypergraph.yml", "utf8"),
);
data.gallery = [
  { title: "图形一", image: "/hypergraph.svg", description: "原创标记" },
  { title: "图形二", image: "/hypergraph.svg", description: "第二张" },
];
data.music = [
  { title: "环境音乐", audio: "/audio/bgm.mp3", description: "点击播放" },
];
await fs.writeFile(root + "/source/_data/hypergraph.yml", yaml.dump(data));
console.log("Completion fixture prepared");
