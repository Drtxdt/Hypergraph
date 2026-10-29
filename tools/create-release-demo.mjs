import fs from "node:fs/promises";
import yaml from "js-yaml";
await fs.mkdir("demo/source/_posts", { recursive: true });
await fs.mkdir("demo/source/_data", { recursive: true });
await fs.mkdir("demo/source/audio", { recursive: true });
await fs.mkdir("demo/source/images", { recursive: true });
for (const name of ["welcome", "field-notes", "systems", "showcase"])
  await fs.copyFile(
    ".local/demo/source/_posts/" + name + ".md",
    "demo/source/_posts/" + name + ".md",
  );
const components = (
  await fs.readFile(".local/completion/source/_posts/components.md", "utf8")
)
  .replaceAll("/audio/bgm.mp3", "/audio/sample.wav")
  .replaceAll("/missing-image.png", "/hypergraph.svg");
await fs.writeFile("demo/source/_posts/components.md", components);
await fs.writeFile(
  "demo/_config.yml",
  yaml.dump({
    title: "Hypergraph",
    subtitle: "WORDS / IDEAS / CONNECTIONS",
    author: "Hypergraph",
    description: "记录当下，连接未知。",
    language: "zh-CN",
    timezone: "Asia/Shanghai",
    url: "https://example.com",
    root: "/",
    permalink: ":year/:month/:day/:title/",
    theme: "hypergraph",
    index_generator: { per_page: 10, order_by: "-date" },
    archive_generator: { per_page: 20 },
    tag_generator: { per_page: 20 },
    category_generator: { per_page: 20 },
    highlight: { enable: true, line_number: true },
    prismjs: { enable: false },
    markdown: { render: { html: true, breaks: false, linkify: true } },
  }),
);
const pages = {};
for (const [type, title] of [
  ["about", "关于"],
  ["friends", "同行者"],
  ["gallery", "影像"],
  ["essay", "短动态"],
  ["equipment", "装备"],
  ["music", "音乐"],
  ["room", "工作空间"],
  ["fcircle", "朋友的记录"],
])
  pages[type] = { enable: true, title };
await fs.writeFile(
  "demo/_config.hypergraph.yml",
  yaml.dump({
    preset: "industrial",
    color_mode: "auto",
    menu: {
      home: "/",
      archives: "/archives/",
      空间: {
        关于: "/about/",
        影像: "/gallery/",
        音乐: "/music/",
        友链: "/friends/",
      },
    },
    home: {
      title: "记录当下，连接未知。",
      description: "技术、生活，以及值得留下的思考。",
    },
    pages,
    music: { enable: true, src: "/audio/sample.wav", title: "原创示例提示音" },
    sidebar: {
      enable: true,
      order: ["profile", "latest", "categories", "tags", "archives"],
    },
    appearance: { avatar: "/hypergraph.svg" },
    comments: { enable: false },
  }),
);
const data = {
  about: [
    {
      title: "关于 Hypergraph",
      description:
        "为持续记录而设计。纸白、炭灰与信号黄组成一个安静的阅读空间。",
    },
    {
      title: "开放的结构",
      description: "调整布局与模块顺序，或通过独立扩展定义新的页面构图。",
    },
  ],
  friends: [
    {
      title: "Hexo",
      url: "https://hexo.io",
      description: "快速、简洁且高效的博客框架。",
    },
  ],
  gallery: [
    {
      title: "记录",
      image: "/images/record.svg",
      description: "从一个值得保留的想法开始。",
    },
    {
      title: "连接",
      image: "/images/connect.svg",
      description: "让不同的记录彼此关联。",
    },
  ],
  essay: [
    {
      title: "从今天开始",
      date: "2026-10-29",
      description: "不用等待所有事情都想明白，先记下一小段。",
    },
  ],
  equipment: [
    {
      title: "纸与笔",
      description: "用于草图、临时记号和离线思考。",
      status: "日常使用",
    },
  ],
  music: [
    {
      title: "示例提示音",
      audio: "/audio/sample.wav",
      description: "由演示构建脚本生成，点击试听。",
    },
  ],
  room: [
    {
      title: "工作台",
      image: "/images/record.svg",
      description: "放下设备，也放下一些未完成的想法。",
    },
  ],
  fcircle: [
    {
      title: "Hexo 文档",
      url: "https://hexo.io/docs/",
      description: "来自社区的知识与经验。",
    },
  ],
};
await fs.writeFile("demo/source/_data/hypergraph.yml", yaml.dump(data));
for (const [name, label, n] of [
  ["record", "RECORD", 1],
  ["connect", "CONNECT", 2],
])
  await fs.writeFile(
    `demo/source/images/${name}.svg`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800"><rect width="1200" height="800" fill="#202421"/><path d="M80 80H1120V720H80Z" fill="none" stroke="#58605a"/><path d="M120 540H1080M120 160V660M600 160V660" stroke="#58605a"/><circle cx="${n === 1 ? 360 : 840}" cy="360" r="140" fill="#eed84a"/><path d="M360 360H840" stroke="#f3f2ec" stroke-width="8"/><text x="120" y="660" fill="#f3f2ec" font-family="sans-serif" font-size="72" letter-spacing="10">0${n} / ${label}</text></svg>`,
  );
const rate = 22050,
  seconds = 2,
  samples = rate * seconds,
  buffer = Buffer.alloc(44 + samples * 2);
buffer.write("RIFF", 0);
buffer.writeUInt32LE(buffer.length - 8, 4);
buffer.write("WAVEfmt ", 8);
buffer.writeUInt32LE(16, 16);
buffer.writeUInt16LE(1, 20);
buffer.writeUInt16LE(1, 22);
buffer.writeUInt32LE(rate, 24);
buffer.writeUInt32LE(rate * 2, 28);
buffer.writeUInt16LE(2, 32);
buffer.writeUInt16LE(16, 34);
buffer.write("data", 36);
buffer.writeUInt32LE(samples * 2, 40);
for (let i = 0; i < samples; i++) {
  const t = i / rate,
    envelope = Math.sin((Math.PI * t) / seconds) ** 2;
  buffer.writeInt16LE(
    Math.round(Math.sin(2 * Math.PI * 440 * t) * envelope * 3500),
    44 + i * 2,
  );
}
await fs.writeFile("demo/source/audio/sample.wav", buffer);
await fs.writeFile(
  "demo/package.json",
  JSON.stringify(
    {
      name: "hypergraph-demo",
      private: true,
      scripts: { build: "hexo clean && hexo generate", serve: "hexo server" },
      hexo: { version: "7.3.0" },
      dependencies: {
        hexo: "7.3.0",
        "hexo-theme-hypergraph": "file:../dist/hexo-theme-hypergraph-1.0.0.tgz",
        "hexo-generator-index": "^4.0.0",
        "hexo-generator-archive": "^2.0.0",
        "hexo-generator-category": "^2.0.0",
        "hexo-generator-tag": "^2.0.0",
        "hexo-server": "^3.0.0",
      },
      overrides: {
        "markdown-it": "^14.3.3",
        "linkify-it": "^5.0.2",
        yaml: "^2.8.3",
      },
    },
    null,
    2,
  ),
);
console.log(
  "Created distributable demo with five public posts, eight collections and original assets.",
);
