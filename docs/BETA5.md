# beta.5：从安装到自己的站点

需要 Node 22.12+ / 24、Hexo 7.3 / 8。先在站点副本中安装交付包：

```sh
npm install ./hexo-theme-hypergraph-2.1.0-beta.5.tgz
```

站点 `_config.yml` 设置 `theme: hypergraph`、真实 `title/author/description/url`；子目录部署设置 `root: /blog/`。按 QUICKSTART.md 统一 Markdown-it 渲染链，然后运行 `npx hexo clean && npx hexo generate`。使用者无需安装 Vite。

## 身份、菜单与图片

主题覆盖放在 `_config.hypergraph.yml`。不写 menu 即使用八项默认导航。没有默认 H 标志；`site_logo` 和 `appearance.avatar` 可使用自己的本地图片。音乐仍需主动开启并提供音源。

```yaml
appearance:
  avatar: /images/me.jpg
  author_status: 持续记录中
  cover_fit: cover
pages:
  about: {enable: true, path: profile/}
  essay: {enable: false}
  tools: {enable: true, builtins: [json, text, codec]}
  games: {enable: true, builtins: ['2048', minesweeper]}
```

注意 YAML 中 2048 需写成字符串：实际配置使用 `builtins: ['2048', minesweeper]`。关闭页面自动隐藏引用它的默认入口。若要排序，复制完整菜单并改动；数组整体替换：

```yaml
menu:
  - {label: home, url: /, icon: home}
  - {label: archives, url: /archives/, icon: archive}
  - {label: gallery, page: gallery, icon: image}
  - {label: essay, page: essay, icon: note, enable: false}
  - {label: friends, page: friends, icon: users}
  - {label: tools, page: tools, icon: tool}
  - {label: games, page: games, icon: gamepad}
  - {label: about, page: about, icon: user}
```

每项使用 url、page 或单层 children 之一；page 跟随自定义路径。已有手写页面优先，不会被生成器覆盖。

精选只从首页第一页选择，优先最高 sticky；不改变后续分页。`home.sections` 默认 `[intro, featured, posts]`，显式顺序始终保留。分类入口使用真实分类与数量。

封面优先填写 `cover` 或 `banner`。横图使用 cover 裁切及 `cover_position: '50% 50%'`；竖图、带文字截图可设 `cover_fit: contain` 完整显示，不放大、不遮盖。文章 `cover_mode: compact/feature/none` 与全局 `appearance.show_cover: false` 仍生效。正文图片不受封面裁切影响。

旧摘要图片候选只读扫描，安装包已经包含命令及依赖：

```sh
npx --no-install hg-cover-candidates source/_posts
```

命令输出 JSON 到标准输出，缺省路径为 source/_posts；不下载图片、不写文章，跳过已有封面或加密文章。选择候选后人工填写 front matter。

## 专页数据

在站点 `source/_data/hypergraph.yml` 填数据。旧版 about/friends/gallery 数组继续可用；其他基础集合页维持原数组模型。以下为可复制的公开示例，替换为自己的内容：

```yaml
about:
  profile: {name: 记录者, bio: 关于技术与生活的观察。}
  projects:
    - {title: 项目笔记, description: 记录一次完整实践。, url: /archives/}
  timeline:
    - {date: '2026', title: 开始写作, description: 从一篇短笔记开始。}
  interests: [设计, 技术]
  links:
    - {label: 邮件, url: 'mailto:hello@example.com'}
  posts: [hello-world]
friends:
  groups:
    - title: 技术文档
      items:
        - {title: Hexo, url: 'https://hexo.io/', description: 静态博客框架。}
  application: 请通过站长的联系方式交流。
gallery:
  albums:
    - slug: observations
      title: 日常观察
      description: 一些值得保留的画面。
      cover: /images/photo.jpg
      photos:
        - {image: /images/photo.jpg, caption: 某个清晨, width: 1200, height: 800}
tools:
  links:
    - {title: Hexo 文档, description: 官方使用说明。, url: 'https://hexo.io/docs/', icon: link, group: 参考}
games:
  links: []
```

相册 slug 使用小写字母、数字和连接符且不可重复，生成 `<gallery路径>/<slug>/`。没有数据不输出虚构记录。工具／娱乐外链卡片支持 title、description、url、icon、image、group；使用原生链接，不嵌入第三方网页或自动请求其图标。

## 工具与娱乐

JSON 校验／格式化／压缩、文本统计、URL／UTF-8 Base64 转换在本机 Worker 内处理，输入上限 1MiB，不上传、不存储。字符数按 Unicode 码点，行数按换行符分隔，中文使用 Han 字符统计，英文词按拉丁字母及内部连接符统计。

2048 为 4×4，扫雷为 9×9 / 10 雷，首次点击及周围安全。支持键盘和触摸；扫雷可切换标旗模式。游戏进度按标签页保存，离页及后台暂停；存储不可用不影响游玩。关闭单项 builtins 就不生成对应功能页面，空数组仅保留外链导航。无 JavaScript 时仍能浏览目录与外链，站内计算和游戏会提示启用脚本。

## 入场与验证

动画和图片并行：480ms 到60%、停600ms、480ms 到100%、240ms 扫满、600ms 淡出，正常约2.4秒。图片失败或迟到不额外阻塞正文。always 默认保留；session/off、减少动态效果、历史恢复、深层锚点和省流语义不变。迟到启动、用户跳过和异常结束分别记录。

`npm run verify` 包含真实摄影封面、SVG、无图、长文与独立页面，各首访／后续访问三轮。gzip 性能条件要求托管端实际协商 main.css.gz/main.js.gz（或等价实时压缩），并返回正确 Content-Encoding；仅上传 .gz 文件不会自动开启压缩。无输入稳定性和交互分别测试。失败样本不自动重试，不等同于生产第三方服务认证或真实用户 INP。

历史记录见 BETA3.md / BETA4.md，不能用于认证本次构建。最终提交、包散列、截图录像与实测结果以 beta.5 交付报告为准。本轮没有部署或修改正式博客。
