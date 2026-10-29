---
title: 图形、内容标签与代码展示
description: 流程图、数据图表、乐谱与脚注，让复杂想法拥有合适的表达方式。
date: '2026-10-28 10:00:00'
tags: [测试, 图形]
---
## 流程图
{% mermaid %}
flowchart LR
 A[阅读] --> B[思考]
 B --> C[记录]
{% endmermaid %}
## 图表
{% chartjs %}
{"type":"bar","data":{"labels":["A","B","C"],"datasets":[{"label":"Notes","data":[2,4,3]}]},"options":{"animation":false}}
{% endchartjs %}
## 乐谱
{% score %}
X:1
T:Notes
M:4/4
K:C
CDEF GABc|cBAG FEDC|
{% endscore %}
## 内容标签
{% tabs demo %}
<!-- tab 说明 -->
第一段内容。
<!-- endtab -->
<!-- tab 详情 -->
第二段内容。
<!-- endtab -->
{% endtabs %}
{% button Hexo, https://hexo.io %}

## 脚注
文字的补充说明[^1]。

[^1]: 这是一条脚注。
