---
title: 在子目录部署静态博客时检查资源路径与缓存
date: 2026-10-04 10:00:00
cover: /images/terminal.svg
description: 用最小构建检查根目录、子目录和静态资源。
categories: [技术]
tags: [Hexo, 部署]
---
## 检查生成结果

```sh
hexo clean
hexo generate
```

![构建信息示意图](/images/terminal.svg)

| 入口 | 资源根路径 |
| --- | --- |
| 首页 | /blog/ |
| 文章 | /blog/assets/ |
