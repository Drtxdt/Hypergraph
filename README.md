# Hypergraph

原创 Hexo 主题：纸白与深炭灰、局部信号黄、清晰的内容层级。采用统一的终末地启发式构图，提供完整明暗模式、结构化配置和 npm 扩展接口。

## 安装

在 Hexo 站点目录安装交付的主题包，然后设置站点 `_config.yml` 的 `theme: hypergraph`。Node.js 要求 22.12+ 或 24，Hexo 支持 7.3 与 8。

```sh
npm install ./hexo-theme-hypergraph-2.0.0.tgz
npm uninstall hexo-renderer-marked hexo-renderer-markdown-it
npx hexo clean
npx hexo generate
```

主题内置 Markdown-it 渲染器与已编译浏览器资源，使用者无需运行 Vite。不要同时启用其他 Markdown、公式或代码高亮渲染链。KaTeX 为默认构建期公式引擎，单篇可以选择 MathJax 或关闭。

在站点根目录创建 `_config.hypergraph.yml`：

```yaml
preset: endfield
color_mode: auto
home:
  title: 记录当下，连接未知。
menu:
  - { label: home, url: /, icon: home }
  - { label: archives, url: /archives/, icon: archive }
comments:
  enable: false
```

配置对象补充默认值，数组整体替换，未知字段会指出位置。可选功能默认不加载相关客户端；音乐由访客启动，增强导航下保持同一播放器实例。图形、评论、简繁转换等资源随安装包提供，外部服务仍需要站长配置对应账号或服务地址。

- [入门与内容语法](docs/QUICKSTART.md)
- [配置说明](docs/CONFIGURATION.md) · [完整默认配置](docs/config-reference.yml)
- [扩展与预设](docs/EXTENSIONS.md)
- [评论部署](docs/COMMENTS.md) · [服务适配参数](docs/SERVICES.md)
- [迁移说明](docs/MIGRATION.md)
- [固定版本功能对照](docs/FEATURES.md) · [验收记录](docs/ACCEPTANCE.md)
- [English guide](README.en.md)

开发：`npm ci`、`npm run typecheck`、`npm test`、`npm run build`。实际浏览器回归使用 `tools/browser-*.mjs`，独立验证站保存在不发布的 `.local/`。演示源站在 `demo/`，与用户博客和加密测试样例分离。

原创代码使用 MIT 许可；第三方组件及字体保留各自许可，见 [第三方说明](THIRD-PARTY-NOTICES.md)。

## 可复现验收

`npm ci` 后运行 `npm run verify`。Windows 默认使用已安装的 Edge；其他平台先执行 `npx playwright install --with-deps chromium`。可用 `HG_BROWSER=chromium` 指定 Playwright Chromium。

命令会构建资源、生成独立公开测试站、分配临时端口、运行浏览器与性能检查、输出 `.local/verification/report.json` 和截图，并清理临时站点。首次会安装 `deploy/waline` 的锁定依赖，用临时 SQLite 验证匿名评论。无需私人博客或固定端口。`--keep` 仅用于保留失败样例；`--skip-build` 仅用于诊断，不能作为正式发布验收。

`npm run verify:compat` 验证当前运行时的 Hexo 7.3/8、根目录和 `/blog/`；Windows 默认同时检查本机 Node 22，其他位置可通过 `HG_COMPAT_NODE22` 指定。CI 分别运行 Node 22/24，保留各自报告。CI 配置已提供，远端执行结果须以实际工作流为准。

截图是当前构建的观察记录，不会自动替换批准的视觉基准；操作系统中文字体差异需要人工比较。真实托管评论账号、线上网络和真实用户 INP 不由本地模拟测试替代。

## 2.1 beta.2 阅读与入场

`post.cover_mode` 支持 `compact`（默认）、`feature` 和 `none`，文章 front matter 可单独覆盖；`appearance.show_cover: false` 始终优先。非法封面模式会报告对应文章位置。标题与正文共用主轴，手机目录收拢到阅读工具区。

`appearance.intro_scope: home | all` 默认为 `home`，仅首页第一页整页访问播放。百分比表示动画进度：480ms 到 60%，停留 1000ms，再用 480ms 到 100%，480ms 揭幕与首页进入重叠。可读性优先：从导航开始计算的 2350ms 预算可能提前结束揭幕或慢加载，不伪造完成。可跳过；减少动态效果、节省流量、后台与存储不可用时直接显示或结束。站内导航不重复品牌入场。

代码语言徽标与复制按钮使用紧凑工具栏，高亮独立适配明暗代码主题。桌面侧栏仅悬停或键盘展开，触摸设备保留菜单按钮。图标按钮保留可访问名称；协议密钥支持显示切换、错误及成功反馈。B站与 Instagram 快捷按钮复制链接供手动分享。
