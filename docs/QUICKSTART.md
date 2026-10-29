# 入门与文章

主题包在普通 Hexo 站点中安装后，将 `_config.yml` 设置为 `theme: hypergraph`、`language: zh-CN`，并填写真实 `url`。子目录部署同时设置 `root: /blog/` 与包含 `/blog` 的站点 URL。关闭旧 Markdown 渲染器和重复公式插件，使用主题内置的 Markdown-it。

代码高亮使用 Hexo 的 `highlight.enable: true`；避免同时开启 Prism。普通命令仍是 `hexo clean`、`hexo generate` 和 `hexo server`。主题更新后先清理再生成。

## 文章元信息

```yaml
title: 一篇新记录
date: '2026-10-29 09:00:00'
tags: [生活, 技术]
categories: [记录]
sticky: 1
cover: /images/cover.jpg
banner: /images/banner.jpg
summary: 可选的手写摘要。
series: 开发笔记
math_engine: katex
comments: true
```

没有封面时使用完整文字版式。置顶值越高，越优先进入首页精选。日期建议写明时间；迁移旧站时必须保留旧时区与永久链接设置。

公式使用 `$...$` 和 `$$...$$`。流程图使用 `mermaid` 标签或 fenced mermaid 代码块；图表使用 `chartjs` 标签包裹 Chart.js JSON；乐谱使用 `score` 标签包裹 ABC 文本。乐谱可在正文前写 JSON 参数，再用一行 `------` 分隔。

## 内容标签

以下是 Hypergraph 的推荐参数格式。旧主题的全部标签名称有处理器；参数统一采用这里的格式，只有现有博客使用的 `warning` 与 `linkcard` 承诺保留其原有格式。

```text
{% note 提示 %}Markdown 正文{% endnote %}
{% folding 展开 %}折叠内容{% endfolding %}
{% hideInline 隐藏文字, 点击显示 %}
{% button 按钮文字, https://example.com %}
{% btn https://example.com, 按钮文字 %}
{% link 链接标题, https://example.com, 描述 %}
{% image /images/example.jpg, 图片说明, 640 %}
{% inlineImg /hypergraph.svg, 行内图标, 24 %}
{% audio /audio/sample.wav %}
{% video /video/example.mp4 %}
{% checkbox checked, 已完成 %}
{% radio checked, 已选择 %}
{% bilibili BVxxxxxxxxxx %}
{% dogeplayer 用户数字ID 视频代码 %}
{% series 开发笔记 %}
```

`tabs`、`subtabs`、`subsubtabs` 内使用 `<!-- tab 标题 -->` 与 `<!-- endtab -->`；浏览器提供方向键、Home/End 切换，没有 JavaScript 时仍可展开原生 details。`timeline` 使用 `<!-- timeline 标题 -->` 与 `<!-- endtimeline -->`。`gallery` 包裹 Markdown 图片；`galleryGroup` 使用四个带引号参数：名称、说明、链接、封面。

`flink` 与 `Introduction-card` 包裹 YAML 数组，每项包含 `title`、`url`、`description` 和可选 `image`。`intCard` 使用链接、图片、提示、标题、头像、作者、副标题七个参数。`btns`、`sitegroup`、`videos` 用于组合内容。行内标签支持 `u`、`emp`、`wavy`、`del`、`kbd`、`psw`、`p`、`span`、`label`、`icon`；文本会转义，图标可直接填写 Unicode 字符。

文章中的原始 HTML 会保留。增强导航不会重新执行任意文章脚本；交互功能请使用内置标签或扩展的挂载/清理接口。

## 专用页面与音频

在 `_config.hypergraph.yml` 打开 `pages.gallery.enable` 等开关，在 `source/_data/hypergraph.yml` 填写同名数组。`pages.<type>.path` 不能与已有 Markdown 页面的输出路径重复。

```yaml
gallery:
  - title: 山间记录
    image: /images/mountain.jpg
    description: 某个清晨。
music:
  - title: 环境音乐
    audio: /audio/sample.wav
```

全局播放器使用 `music.enable`、`src`、`title` 和可选 `playlist`。播放列表每项为 `{ title, src }`；远程 `endpoint` 返回同样的数组，只在访客开始播放后请求。音频不自动播放。
