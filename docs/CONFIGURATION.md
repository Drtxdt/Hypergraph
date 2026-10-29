# 配置

站点使用 `_config.hypergraph.yml`，不要修改主题内的默认配置。优先级为主题默认值、风格预设、独立覆盖文件、站点 `theme_config`。对象递归补充，数组整体替换。未知字段、错误类型和缺失的服务参数会报出具体位置。完整默认值见 `config-reference.yml`，包含每个正式字段；Schema 是权威类型定义。

```yaml
preset: endfield # 官方统一外观
color_mode: auto # auto / light / dark
home:
  title: 记录当下，连接未知。
  description: 关于技术，也关于生活。
  featured: true
menu:
  - { label: 首页, url: /, icon: home }
  - { label: 归档, url: /archives/, icon: archive }
  - { label: 关于, url: /about/, icon: user }
navigation: true
search: true
toc: true
reading_mode: true
math: katex # katex / mathjax / off，均在生成时处理
music:
  enable: true
  src: /audio/bgm.mp3
  title: 背景音乐
comments:
  enable: false
  provider: waline # 全部服务参数见 SERVICES.md
  server: ''
sidebar:
  enable: false
  order: [profile, latest, categories, tags, stats]
code:
  copy: true
  wrap: false
  fold: false
post:
  share: true
  copyright: true
  license: All rights reserved
  outdated_days: 0
  reward: []
```

完整字段与默认值见根目录 `config.schema.json`。`fonts` 分为 `body`、`display`、`code`；`colors.accent` 使用六位十六进制颜色。`background.image` 为图片地址，`opacity` 为 0–1；建议先测试明暗模式的文字对比度。

文章 front-matter 支持 `cover`、`summary`、`series`、`math_engine`、`comments`。`math_engine` 可以覆盖全站公式引擎，一篇文章只使用一个引擎。`password` 开启 AES-GCM 加密，`abstract` 是明确公开的手写摘要；密码和正文不要放进标题、标签、分类或摘要。静态加密仍要求使用足够强的密码。加密文章不进入全文搜索或 RSS，并默认关闭评论。

专用页面通过 `pages.<type>.enable` 开启，类型为 `about`、`friends`、`gallery`、`essay`、`equipment`、`music`、`room`、`fcircle`。每类支持 `title`、`description`、`path`。内容保存在站点 `source/_data/hypergraph.yml` 的同名数组里，每项支持 `title`、`description`、`image`、`url`、`date`、`audio`、`status`。朋友圈可配置 `endpoint` 获取远程聚合；服务失败不会影响其他页面。

```yaml
friends:
  - title: Hexo
    description: 快速、简洁且高效的博客框架。
    url: https://hexo.io/
equipment:
  - title: 随身笔记本
    description: 记录随时出现的想法。
    status: 正在使用
```

评论服务：Waline 和 Artalk 使用 `server`；Artalk 可指定 `site`；Twikoo 使用 `env_id`；Giscus 需要 `repo`、`repo_id`、`category_id`。Giscus 访客需要 GitHub，默认 Waline 支持匿名评论。

`inject.head`、`inject.body` 是可信站点维护者提供的原始 HTML 字符串数组。增强导航不会重新执行文章里的任意脚本；需要跨页初始化的代码应使用扩展接口。

`feeds.rss`、`feeds.sitemap` 默认开启；`pwa.enable` 默认关闭，启用后提供安装清单与离线提示，不缓存解锁正文。图表、乐谱、评论和灯箱按页面元素加载。音乐不自动播放，首次需要访客点击。

`home.sections` 控制介绍、精选、文章列表的顺序与可见性；`sidebar.order` 控制侧栏组件。`appearance` 配置横幅、头像、圆角、表格、图注和图片回退；`taxonomy_banners` 的键采用 `category:名称` 或 `tag:名称`。`fonts` 可设置字号和行高，`post.meta` 可排序日期、更新时间、阅读时间和字符数。

`interaction` 包含工具栏、工具面板、简繁、排版间距、预取、隐私提示和可选右键菜单。右键菜单在链接、图片、输入框、代码和文字选择上保留浏览器默认行为，按 Shift 也能直接打开原生菜单。`effects` 默认全部关闭，并遵循减少动态效果、节省流量、后台暂停与手机开关。

`resources.asset_base` 可将整个 assets 目录映射到自己的静态资源域名，需完整上传目录并提供正确 MIME/CORS；相对动态导入沿该基址解析。默认资源同源。`navigation_exclude` 列出的站内路径使用普通导航；关闭 `navigation` 后整个站点使用浏览器正常导航。

## 2.0 外观和导航

官方外观仅为 `preset: endfield`。升级时删除旧 `layout` 字段，将对象导航改为有序数组；不再接受 industrial、ledger 或 reading 外观别名。阅读模式仍由 `reading_mode` 控制。

```yaml
appearance:
  motion: cinematic # cinematic / subtle / off
  cover_tint: false
menu:
  - label: home
    url: /
    icon: home
  - label: 空间
    icon: grid
    children:
      - {label: 关于, url: /about/}
```

`cinematic` 只对首页和记录列表应用分段进入及精细指针封面反馈，文章正文不会隐藏等待动画。移动端缩短动效，省流量使用轻反馈，减少动态效果及 `off` 禁用装饰动效。后台暂停，切页清理。导航子项只支持一层。

文章 `cover_position: "50% 50%"` 调整封面焦点，默认居中。无图精选使用文字构图；首页主推荐只从第一页文章集合中选择，优先 sticky，不改变后续分页。`home.sections` 可选 `featured`、`posts`、`intro`，默认不输出口号区。手机目录可折叠，音乐界面可关闭而不停止播放。


## 2.1 entrance motion

`appearance.intro: session | always | off` defaults to `session`. The intro runs only with `appearance.motion: cinematic`; reduced motion, data saving, history restoration and deep anchors bypass it. `interaction.loading_bar` remains the separate navigation waiting indicator. Desktop navigation expands on hover or keyboard focus; clicking its toggle pins it open.
