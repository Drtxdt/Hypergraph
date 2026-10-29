import fs from "node:fs/promises";
import path from "node:path";
const root = path.resolve(".local/demo");
await fs.mkdir(path.join(root, "source/_posts"), { recursive: true });
await fs.copyFile(".local/blog/package.json", path.join(root, "package.json"));
await fs.cp(".local/blog/node_modules", path.join(root, "node_modules"), {
  recursive: true,
});
await fs.writeFile(
  path.join(root, "_config.yml"),
  `title: Hypergraph\nsubtitle: A PERSONAL FIELD JOURNAL\ndescription: Notes on technology, design and everyday life.\nauthor: Hypergraph\nurl: https://example.com\nroot: /\nlanguage: zh-CN\ntimezone: Asia/Shanghai\ntheme: hypergraph\npermalink: :year/:month/:day/:title/\nindex_generator:\n  per_page: 10\n  order_by: -date\nhighlight:\n  enable: true\n  line_number: true\nmarkdown:\n  render:\n    html: true\n    breaks: false\n  plugins:\n    - markdown-it-footnote\n`,
);
const specimens = [
  [
    "welcome",
    "从一页记录开始",
    '这是一套关于记录、阅读与连接的主题。\n\n## 阅读体验\n\n完整正文，清晰的层次，以及属于内容的留白。\n\n> 让设计为文字让路。\n\n## 代码\n\n```ts\nconst hello: string = "Hypergraph";\nconsole.log(hello);\n```\n\n## 公式\n\n$$\n\\sum_{i=1}^{n}i=\\frac{n(n+1)}{2}\n$$\n\n| 功能 | 状态 |\n|---|---|\n| 明暗主题 | 跟随系统 |\n| 响应布局 | 手机优先 |\n\n{% warning 注意 %}\n真实内容比占位图更能检验界面。\n{% endwarning %}\n',
  ],
  [
    "field-notes",
    "在生活里发现新的连接",
    "## 山间的信号\n\n设计来自观察。把想法写下来，下一次出发就有了起点。\n\n{% folding 展开札记 %}\n今天的天气很好。\n{% endfolding %}\n",
  ],
  [
    "systems",
    "把复杂留给系统，把简单留给读者",
    "## 从默认值开始\n\n配置应该可以渐进覆盖。每一个关闭值，都应该真正关闭功能。\n",
  ],
  [
    "encrypted-text",
    "加密测试 · 普通正文",
    "PRIVATE_CANARY_TEXT_7329\n\n## 私密标题\n\n这段正文只能在解锁之后显示。",
  ],
  [
    "encrypted-code",
    "加密测试 · 代码与公式",
    'PRIVATE_CANARY_CODE_7329\n\n```js\nconst secret = "PRIVATE_CANARY_CODE_7329";\n```\n\n$$E=mc^2$$',
  ],
  [
    "encrypted-navigation",
    "加密测试 · 导航",
    "PRIVATE_CANARY_NAV_7329\n\n[返回首页](/)\n\n## 深层锚点\n\n解锁内容只存在于当前页面。",
  ],
];
for (let i = 0; i < specimens.length; i++) {
  const [slug, title, body] = specimens[i];
  await fs.writeFile(
    path.join(root, "source/_posts", slug + ".md"),
    `---\ntitle: ${title}\ndate: '2026-10-${String(28 - i).padStart(2, "0")} 12:00:00'\ntags: [设计, 札记]\n${slug.startsWith("encrypted") ? "password: fixture-password-7329\nabstract: 这是独立的加密测试文章。\n" : ""}---\n${body}\n`,
  );
}
console.log("Created isolated demo with three encrypted fixtures.");
