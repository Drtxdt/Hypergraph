---
title: 完整组件验证 · Components
description: 从提示与折叠，到多标签内容与媒体，一组可以自由组合的写作组件。
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
{% media audio, /audio/sample.wav, 音频样例 %}
{% series 验证系列 %}
{% flink %}
- title: Hexo
  url: https://hexo.io
  description: 博客框架
{% endflink %}

## 代码与表格

```javascript
const example = "复制正文，不含行号";
```

| Header | Value |
|---|---|
| Example | 42 |

![图注样例](/hypergraph.svg)
![失败图片](/hypergraph.svg)
