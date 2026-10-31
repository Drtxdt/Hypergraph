import fs from "node:fs/promises";
import yaml from "js-yaml";
const root = ".local/demo";
const file = root + "/_config.hypergraph.yml";
const config = yaml.load(await fs.readFile(file, "utf8")) || {};
config.comments = {
  enable: true,
  provider: "waline",
  server: "http://127.0.0.1:9090",
};
config.pages = {
  friends: { enable: true, title: "同行者" },
  gallery: { enable: true, title: "影像札记" },
  equipment: { enable: true, title: "日常装备" },
  essay: { enable: true, title: "短动态" },
  music: { enable: true, title: "音乐收藏" },
  about: { enable: true, title: "关于" },
  room: { enable: true, title: "我的空间" },
  fcircle: { enable: true, title: "朋友的记录" },
};
config.sidebar = {
  enable: true,
  order: ["profile", "latest", "categories", "tags", "stats"],
};
await fs.writeFile(file, yaml.dump(config));
await fs.mkdir(root + "/source/_data", { recursive: true });
await fs.writeFile(
  root + "/source/_data/hypergraph.yml",
  yaml.dump({
    friends: { groups: [{items: [
      {
        title: "Hexo",
        description: "快速、简洁且高效的博客框架。",
        url: "https://hexo.io/",
      },
    ]}] },
    equipment: [
      {
        title: "纸笔",
        description: "离线记录，不需要充电。",
        status: "正在使用",
      },
    ],
    essay: [
      {
        title: "出发",
        description: "让文字成为生活的索引。",
        date: "2026-10-28",
      },
    ],
    about: { sections: [
      { title: "Hypergraph", description: "为阅读而设计的个人博客主题。" },
    ] },
    room: [{ title: "工作台", description: "保留一些未完成的想法。" }],
    fcircle: [
      {
        title: "Hexo 文档",
        url: "https://hexo.io/docs/",
        description: "来自社区的知识。",
      },
    ],
  }),
);
const showcase = `---\ntitle: 图形、内容标签与代码展示\ndate: '2026-10-28 10:00:00'\ntags: [测试, 图形]\n---\n## 流程图\n{% mermaid %}\nflowchart LR\n A[阅读] --> B[思考]\n B --> C[记录]\n{% endmermaid %}\n## 图表\n{% chartjs %}\n{"type":"bar","data":{"labels":["A","B","C"],"datasets":[{"label":"Notes","data":[2,4,3]}]},"options":{"animation":false}}\n{% endchartjs %}\n## 乐谱\n{% score %}\nX:1\nT:Notes\nM:4/4\nK:C\nCDEF GABc|cBAG FEDC|\n{% endscore %}\n## 内容标签\n{% tabs demo %}\n<!-- tab 说明 -->\n第一段内容。\n<!-- endtab -->\n<!-- tab 详情 -->\n第二段内容。\n<!-- endtab -->\n{% endtabs %}\n{% button Hexo, https://hexo.io %}\n\n## 脚注\n文字的补充说明[^1]。\n\n[^1]: 这是一条脚注。\n`;
await fs.writeFile(root + "/source/_posts/showcase.md", showcase);
console.log("Added demo collections, diagrams and local Waline configuration.");
